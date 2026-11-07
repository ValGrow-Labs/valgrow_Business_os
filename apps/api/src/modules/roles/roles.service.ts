import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getRoles(organizationId: string) {
    const roles = await this.prisma.role.findMany({
      where: organizationId
        ? {
            OR: [
              { organizationId },
              { organizationId: null, isSystem: true },
            ],
          }
        : {
            organizationId: null,
            isSystem: true,
          },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { members: organizationId ? { where: { organizationId } } : true },
        },
      },
      orderBy: [
        { isSystem: "desc" },
        { createdAt: "asc" },
      ],
    });

    // Deduplicate by distinct role name and stable database ID,
    // prioritizing organization-specific roles over global system roles
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const deduplicated = roles.filter((r) => {
      if (seenIds.has(r.id)) return false;
      const normalizedName = r.name.trim().toLowerCase();
      if (seenNames.has(normalizedName)) return false;
      seenIds.add(r.id);
      seenNames.add(normalizedName);
      return true;
    });

    return deduplicated.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      scope: r.scope,
      membersCount: r._count.members,
      permissions: r.permissions.map((rp) => rp.permission.key),
      createdAt: r.createdAt,
    }));
  }

  async createRole(organizationId: string, data: any) {
    const trimmedName = (data.name || "").trim();
    if (!trimmedName) {
      throw new ConflictException("Role name is required");
    }

    const existing = await this.prisma.role.findFirst({
      where: {
        organizationId,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A role named "${trimmedName}" already exists in this organization`,
      );
    }

    const role = await this.prisma.role.create({
      data: {
        organizationId,
        name: trimmedName,
        description: data.description,
        scope: data.scope || "Organization",
        isSystem: false,
      },
    });

    if (data.permissionIds && Array.isArray(data.permissionIds)) {
      await this.prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
        })),
      });
    }

    return role;
  }

  async updateRole(id: string, organizationId: string, data: any, actorId?: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        OR: [
          { organizationId },
          { organizationId: null, isSystem: true },
        ],
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.isSystem) {
      throw new ForbiddenException("System roles cannot be modified");
    }

    const oldPermissionKeys = role.permissions.map((rp) => rp.permission.key);

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        scope: data.scope,
      },
    });

    let newPermissionKeys = oldPermissionKeys;

    if (data.permissionIds && Array.isArray(data.permissionIds)) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      await this.prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId,
        })),
      });

      const newPerms = await this.prisma.permission.findMany({
        where: { id: { in: data.permissionIds } },
      });
      newPermissionKeys = newPerms.map((p) => p.key);
    }

    const added = newPermissionKeys.filter((k) => !oldPermissionKeys.includes(k));
    const removed = oldPermissionKeys.filter((k) => !newPermissionKeys.includes(k));

    // Only create notification after business operation succeeded
    if (added.length > 0 || removed.length > 0 || (data.name && data.name !== role.name)) {
      await this.notificationsService.notifyRoleUpdated({
        organizationId: role.organizationId || organizationId,
        roleId: updated.id,
        roleName: updated.name,
        permissionsAdded: added,
        permissionsRemoved: removed,
        actorId,
      });
    }

    return updated;
  }
}

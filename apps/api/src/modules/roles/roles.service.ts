import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles(organizationId: string) {
    const roles = await this.prisma.role.findMany({
      where: {
        OR: [{ organizationId }, { isSystem: true }],
      },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { members: { where: { organizationId } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return roles.map((r) => ({
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
    const role = await this.prisma.role.create({
      data: {
        organizationId,
        name: data.name,
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

  async updateRole(id: string, organizationId: string, data: any) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        OR: [{ organizationId }, { isSystem: true }],
      },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.isSystem) {
      throw new ForbiddenException("System roles cannot be modified");
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        scope: data.scope,
      },
    });

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
    }

    return updated;
  }
}

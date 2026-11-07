import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationType } from "@prisma/client";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string, organizationId?: string) {
    const where: any = { recipientId: userId };
    if (organizationId) {
      where.OR = [{ organizationId }, { organizationId: null }];
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string, organizationId?: string) {
    const where: any = { id, recipientId: userId };
    if (organizationId) {
      where.OR = [{ organizationId }, { organizationId: null }];
    }

    const notification = await this.prisma.notification.findFirst({
      where,
    });

    if (!notification) throw new NotFoundException("Notification not found");

    return this.prisma.notification.update({
      where: { id },
      data: { unread: false },
    });
  }

  async markAllAsRead(userId: string, organizationId?: string) {
    const where: any = { recipientId: userId, unread: true };
    if (organizationId) {
      where.OR = [{ organizationId }, { organizationId: null }];
    }

    return this.prisma.notification.updateMany({
      where,
      data: { unread: false },
    });
  }

  /**
   * Core notification creation with duplicate prevention.
   * If an unread or identical event notification was created recently, it prevents duplicates.
   */
  async createNotification(data: {
    organizationId: string;
    recipientId: string;
    title: string;
    body: string;
    kind: NotificationType;
    metadata?: Record<string, any>;
  }) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Duplicate check: Same recipient, organization, title in recent window
    const recentNotifications = await this.prisma.notification.findMany({
      where: {
        organizationId: data.organizationId,
        recipientId: data.recipientId,
        title: data.title,
        createdAt: { gte: fiveMinutesAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const existing of recentNotifications) {
      const existingMeta = existing.metadata as Record<string, any> | null;
      if (existing.unread) {
        // If unread and both have no metadata, prevent duplicate
        if (!data.metadata && !existingMeta) return existing;
        if (existingMeta && data.metadata) {
          const sameRole = Boolean(data.metadata.roleId && existingMeta.roleId === data.metadata.roleId);
          const sameEmail = Boolean(data.metadata.email && existingMeta.email === data.metadata.email);
          const sameBranch = Boolean(data.metadata.branchId && existingMeta.branchId === data.metadata.branchId);
          if (sameRole || sameEmail || sameBranch) {
            return existing;
          }
        }
      }
    }

    return this.prisma.notification.create({
      data: {
        organizationId: data.organizationId,
        recipientId: data.recipientId,
        title: data.title,
        body: data.body,
        kind: data.kind,
        unread: true,
        metadata: data.metadata || undefined,
      },
    });
  }

  /**
   * Helper to retrieve all active administrators/owners for an organization.
   */
  async getOrganizationAdminUserIds(organizationId: string): Promise<string[]> {
    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
        role: {
          name: { in: ["Owner", "Administrator"] },
        },
      },
      select: { userId: true },
    });

    if (members.length > 0) {
      return [...new Set(members.map((m) => m.userId))];
    }

    // Fallback if no specific Admin role found: retrieve all active members of the workspace
    const anyMembers = await this.prisma.organizationMember.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { userId: true },
      take: 20,
    });
    return [...new Set(anyMembers.map((m) => m.userId))];
  }

  /**
   * Event-driven: Triggered when role permissions are updated.
   * Notifies organization admins and members assigned to the role with actual diff and role details.
   */
  async notifyRoleUpdated(params: {
    organizationId: string;
    roleId: string;
    roleName: string;
    permissionsAdded: string[];
    permissionsRemoved: string[];
    actorId?: string;
  }) {
    const adminUserIds = await this.getOrganizationAdminUserIds(params.organizationId);
    const roleMembers = await this.prisma.organizationMember.findMany({
      where: {
        organizationId: params.organizationId,
        roleId: params.roleId,
        status: "ACTIVE",
      },
      select: { userId: true },
    });

    const recipientIds = [...new Set([...adminUserIds, ...roleMembers.map((m) => m.userId)])];

    const addedCount = params.permissionsAdded.length;
    const removedCount = params.permissionsRemoved.length;
    let changeSummary = "permissions were updated";
    if (addedCount > 0 && removedCount > 0) {
      changeSummary = `gained ${addedCount} new permission${addedCount > 1 ? "s" : ""} and lost ${removedCount}`;
    } else if (addedCount > 0) {
      changeSummary = `gained ${addedCount} new permission${addedCount > 1 ? "s" : ""}`;
    } else if (removedCount > 0) {
      changeSummary = `lost ${removedCount} permission${removedCount > 1 ? "s" : ""}`;
    }

    const body = `The "${params.roleName}" role ${changeSummary}.`;
    const metadata = {
      type: "ROLE_UPDATED",
      roleId: params.roleId,
      roleName: params.roleName,
      permissionsAdded: params.permissionsAdded,
      permissionsRemoved: params.permissionsRemoved,
      updatedAt: new Date().toISOString(),
    };

    const created = [];
    for (const recipientId of recipientIds) {
      const notif = await this.createNotification({
        organizationId: params.organizationId,
        recipientId,
        title: "Role updated",
        body,
        kind: NotificationType.INFO,
        metadata,
      });
      if (notif) created.push(notif);
    }
    return created;
  }

  /**
   * Event-driven: Triggered when a new member invitation is successfully created.
   * Notifies organization admins with the real member email and role.
   */
  async notifyMemberInvited(params: {
    organizationId: string;
    memberId: string;
    userId: string;
    email: string;
    roleName: string;
    status?: string;
    actorId?: string;
  }) {
    const adminUserIds = await this.getOrganizationAdminUserIds(params.organizationId);
    const body = `An invitation was issued to ${params.email} with the "${params.roleName}" role.`;
    const metadata = {
      type: "MEMBER_INVITED",
      memberId: params.memberId,
      userId: params.userId,
      email: params.email,
      roleName: params.roleName,
      status: params.status || "Pending Acceptance",
      invitedAt: new Date().toISOString(),
    };

    const created = [];
    for (const recipientId of adminUserIds) {
      const notif = await this.createNotification({
        organizationId: params.organizationId,
        recipientId,
        title: "New member invited",
        body,
        kind: NotificationType.SUCCESS,
        metadata,
      });
      if (notif) created.push(notif);
    }
    return created;
  }

  /**
   * Event-driven: Triggered when a security review becomes due for a branch or organization.
   * Notifies organization admins and branch leadership with real facility and scope details.
   */
  async notifySecurityReviewDue(params: {
    organizationId: string;
    branchId?: string;
    branchName?: string;
    reviewScope?: string;
    actorId?: string;
  }) {
    const adminUserIds = await this.getOrganizationAdminUserIds(params.organizationId);
    const facilityName = params.branchName || "Facility";
    const scope = params.reviewScope || "Quarterly Access & Session Policy Audit";
    const body = `${scope} for ${facilityName} is pending.`;
    const metadata = {
      type: "SECURITY_REVIEW_DUE",
      branchId: params.branchId,
      branchName: facilityName,
      reviewScope: scope,
      status: "Action Pending",
      dueAt: new Date().toISOString(),
    };

    const created = [];
    for (const recipientId of adminUserIds) {
      const notif = await this.createNotification({
        organizationId: params.organizationId,
        recipientId,
        title: "Security review due",
        body,
        kind: NotificationType.WARNING,
        metadata,
      });
      if (notif) created.push(notif);
    }
    return created;
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivityLogs(organizationId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: { organizationId },
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return logs.map((log) => ({
      id: log.id,
      actor: log.actor
        ? `${log.actor.firstName} ${log.actor.lastName}`
        : "System",
      actorEmail: log.actor?.email,
      action: log.action,
      entity: log.entityType,
      target: log.entityId || "-",
      status: "Success",
      createdAt: log.createdAt,
    }));
  }

  async logEvent(
    organizationId: string,
    actorId: string | null,
    action: string,
    entity: string,
    target?: string,
    metadata?: any,
  ) {
    return this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action,
        entityType: entity,
        entityId: target,
        metadata,
      },
    });
  }
}

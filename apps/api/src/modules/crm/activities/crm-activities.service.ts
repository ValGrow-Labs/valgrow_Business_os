import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateActivityDto, UpdateActivityDto } from "./dto/activity.dtos";
import { Prisma } from "@prisma/client";

@Injectable()
export class CrmActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateCrossReferences(
    organizationId: string,
    refs: {
      customerId?: string;
      leadId?: string;
      opportunityId?: string;
      assignedToId?: string;
    },
  ) {
    if (refs.customerId) {
      const cust = await this.prisma.customer.findFirst({
        where: { id: refs.customerId, organizationId, deletedAt: null },
      });
      if (!cust)
        throw new BadRequestException("Invalid or cross-tenant customer");
    }
    if (refs.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: refs.leadId, organizationId, deletedAt: null },
      });
      if (!lead) throw new BadRequestException("Invalid or cross-tenant lead");
    }
    if (refs.opportunityId) {
      const opp = await this.prisma.opportunity.findFirst({
        where: { id: refs.opportunityId, organizationId, deletedAt: null },
      });
      if (!opp)
        throw new BadRequestException("Invalid or cross-tenant opportunity");
    }
    if (refs.assignedToId) {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: refs.assignedToId, organizationId },
      });
      if (!member)
        throw new BadRequestException("Invalid or cross-tenant assigned user");
    }
  }

  async getActivities(
    organizationId: string,
    query?: {
      customerId?: string;
      leadId?: string;
      opportunityId?: string;
      assignedToId?: string;
    },
  ) {
    const where: Prisma.CrmActivityWhereInput = { organizationId };
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.leadId) where.leadId = query.leadId;
    if (query?.opportunityId) where.opportunityId = query.opportunityId;
    if (query?.assignedToId) where.assignedToId = query.assignedToId;

    return this.prisma.crmActivity.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { activityDate: "desc" },
    });
  }

  async createActivity(
    organizationId: string,
    creatorId: string,
    dto: CreateActivityDto,
  ) {
    await this.validateCrossReferences(organizationId, dto);

    return this.prisma.crmActivity.create({
      data: {
        organizationId,
        type: dto.type || "NOTE",
        subject: dto.subject,
        description: dto.description,
        location: dto.location,
        durationMinutes: dto.durationMinutes,
        activityDate: dto.activityDate
          ? new Date(dto.activityDate)
          : new Date(),
        priority: dto.priority || "MEDIUM",
        status: dto.status || "COMPLETED",
        customerId: dto.customerId,
        leadId: dto.leadId,
        opportunityId: dto.opportunityId,
        assignedToId: dto.assignedToId,
        createdById: creatorId,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateActivity(
    id: string,
    organizationId: string,
    dto: UpdateActivityDto,
  ) {
    const existing = await this.prisma.crmActivity.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException("Activity not found");
    await this.validateCrossReferences(organizationId, {
      assignedToId: dto.assignedToId,
    });

    return this.prisma.crmActivity.update({
      where: { id },
      data: {
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        location: dto.location,
        durationMinutes: dto.durationMinutes,
        activityDate: dto.activityDate ? new Date(dto.activityDate) : undefined,
        priority: dto.priority,
        status: dto.status,
        assignedToId: dto.assignedToId,
      },
    });
  }

  async deleteActivity(id: string, organizationId: string) {
    const existing = await this.prisma.crmActivity.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException("Activity not found");

    return this.prisma.crmActivity.delete({ where: { id } });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateTaskDto, UpdateTaskDto } from "./dto/task.dtos";
import { Prisma } from "@prisma/client";

@Injectable()
export class CrmTasksService {
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

  async getTasks(
    organizationId: string,
    query?: {
      customerId?: string;
      leadId?: string;
      opportunityId?: string;
      assignedToId?: string;
      status?: string;
    },
  ) {
    const where: Prisma.CrmTaskWhereInput = { organizationId };
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.leadId) where.leadId = query.leadId;
    if (query?.opportunityId) where.opportunityId = query.opportunityId;
    if (query?.assignedToId) where.assignedToId = query.assignedToId;
    if (query?.status) where.status = query.status as any;

    return this.prisma.crmTask.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  async createTask(
    organizationId: string,
    creatorId: string,
    dto: CreateTaskDto,
  ) {
    await this.validateCrossReferences(organizationId, dto);

    return this.prisma.crmTask.create({
      data: {
        organizationId,
        title: dto.title,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || "MEDIUM",
        status: dto.status || "PENDING",
        customerId: dto.customerId,
        leadId: dto.leadId,
        opportunityId: dto.opportunityId,
        assignedToId: dto.assignedToId,
        createdById: creatorId,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateTask(id: string, organizationId: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.crmTask.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException("Task not found");
    await this.validateCrossReferences(organizationId, {
      assignedToId: dto.assignedToId,
    });

    let completedAt = existing.completedAt;
    if (dto.status === "COMPLETED" && existing.status !== "COMPLETED") {
      completedAt = new Date();
    } else if (dto.status && dto.status !== "COMPLETED") {
      completedAt = null;
    }

    return this.prisma.crmTask.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        status: dto.status,
        assignedToId: dto.assignedToId,
        completedAt,
      },
    });
  }

  async deleteTask(id: string, organizationId: string) {
    const existing = await this.prisma.crmTask.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException("Task not found");

    return this.prisma.crmTask.delete({ where: { id } });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityLogsService } from "../../activity-logs/activity-logs.service";
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  UpdateOpportunityStageDto,
} from "./dto/opportunity.dtos";
import { Prisma } from "@prisma/client";

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private async generateOpportunityNumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx || this.prisma;
    const year = new Date().getFullYear();
    const seq = await db.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "OPP",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "OPP", year, lastSequence: 1 },
    });
    return `OPP-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async validateCrossReferences(
    organizationId: string,
    refs: {
      customerId?: string;
      leadId?: string;
      pipelineId?: string;
      stageId?: string;
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
    if (refs.pipelineId) {
      const pipe = await this.prisma.crmPipeline.findFirst({
        where: { id: refs.pipelineId, organizationId, deletedAt: null },
      });
      if (!pipe)
        throw new BadRequestException("Invalid or cross-tenant pipeline");
    }
    if (refs.stageId) {
      const stage = await this.prisma.crmPipelineStage.findFirst({
        where: { id: refs.stageId, organizationId },
      });
      if (!stage)
        throw new BadRequestException("Invalid or cross-tenant pipeline stage");
    }
    if (refs.assignedToId) {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: refs.assignedToId, organizationId },
      });
      if (!member)
        throw new BadRequestException("Invalid or cross-tenant assigned user");
    }
  }

  async getOpportunities(
    organizationId: string,
    query?: {
      pipelineId?: string;
      stageId?: string;
      customerId?: string;
      assignedToId?: string;
      status?: string;
      search?: string;
    },
  ) {
    const where: Prisma.OpportunityWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (query?.pipelineId) where.pipelineId = query.pipelineId;
    if (query?.stageId) where.stageId = query.stageId;
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.assignedToId) where.assignedToId = query.assignedToId;
    if (query?.status) where.status = query.status as any;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { opportunityNumber: { contains: query.search, mode: "insensitive" } },
        { customer: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    return this.prisma.opportunity.findMany({
      where,
      include: {
        customer: { select: { id: true, customerCode: true, name: true } },
        lead: {
          select: {
            id: true,
            leadNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        pipeline: true,
        stage: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOpportunityById(id: string, organizationId: string) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        customer: true,
        lead: true,
        pipeline: true,
        stage: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        quotations: {
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            totalAmount: true,
          },
        },
        salesOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
          },
        },
        activities: { orderBy: { activityDate: "desc" } },
        tasks: { orderBy: { dueDate: "asc" } },
        crmNotes: { orderBy: { createdAt: "desc" } },
        tags: { include: { tag: true } },
      },
    });

    if (!opp) throw new NotFoundException("Opportunity not found");
    return opp;
  }

  async createOpportunity(
    organizationId: string,
    actorId: string | null,
    dto: CreateOpportunityDto,
  ) {
    await this.validateCrossReferences(organizationId, dto);
    const opportunityNumber =
      await this.generateOpportunityNumber(organizationId);

    const stage = await this.prisma.crmPipelineStage.findUnique({
      where: { id: dto.stageId },
    });

    const opp = await this.prisma.opportunity.create({
      data: {
        organizationId,
        opportunityNumber,
        customerId: dto.customerId,
        leadId: dto.leadId,
        name: dto.name,
        description: dto.description,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        assignedToId: dto.assignedToId,
        estimatedValue: dto.estimatedValue
          ? new Prisma.Decimal(dto.estimatedValue)
          : new Prisma.Decimal(0),
        currency: dto.currency || "INR",
        probability: dto.probability ?? stage?.probability ?? 50,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : null,
        status: dto.status || "OPEN",
      },
      include: {
        customer: { select: { id: true, customerCode: true, name: true } },
        stage: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.logEvent(
      organizationId,
      actorId,
      "OPPORTUNITY_CREATED",
      "Opportunity",
      opp.id,
      { opportunityNumber: opp.opportunityNumber, name: opp.name },
    );

    return opp;
  }

  async updateOpportunity(
    id: string,
    organizationId: string,
    actorId: string | null,
    dto: UpdateOpportunityDto,
  ) {
    const existing = await this.getOpportunityById(id, organizationId);
    await this.validateCrossReferences(organizationId, dto);

    let closedAt = existing.closedAt;
    if (dto.status && dto.status !== "OPEN" && existing.status === "OPEN") {
      closedAt = new Date();
    } else if (dto.status === "OPEN") {
      closedAt = null;
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        assignedToId: dto.assignedToId,
        estimatedValue:
          dto.estimatedValue !== undefined
            ? new Prisma.Decimal(dto.estimatedValue)
            : undefined,
        currency: dto.currency,
        probability: dto.probability,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
        status: dto.status,
        closeReason: dto.closeReason,
        closedAt,
      },
      include: {
        customer: true,
        stage: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (dto.status && dto.status !== existing.status) {
      const actionName =
        dto.status === "WON"
          ? "OPPORTUNITY_WON"
          : dto.status === "LOST"
            ? "OPPORTUNITY_LOST"
            : "OPPORTUNITY_STATUS_CHANGED";

      await this.activityLogs.logEvent(
        organizationId,
        actorId,
        actionName,
        "Opportunity",
        id,
        { status: dto.status, closeReason: dto.closeReason },
      );
    }

    return updated;
  }

  async updateStage(
    id: string,
    organizationId: string,
    actorId: string | null,
    dto: UpdateOpportunityStageDto,
  ) {
    const existing = await this.getOpportunityById(id, organizationId);
    await this.validateCrossReferences(organizationId, {
      stageId: dto.stageId,
    });

    const newStage = await this.prisma.crmPipelineStage.findUnique({
      where: { id: dto.stageId },
    });

    let newStatus = dto.status || existing.status;
    let prob = dto.probability ?? newStage?.probability ?? existing.probability;

    if (newStage?.name.toLowerCase().includes("won")) {
      newStatus = "WON";
      prob = 100;
    } else if (newStage?.name.toLowerCase().includes("lost")) {
      newStatus = "LOST";
      prob = 0;
    }

    let closedAt = existing.closedAt;
    if (newStatus !== "OPEN" && existing.status === "OPEN") {
      closedAt = new Date();
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        stageId: dto.stageId,
        probability: prob,
        status: newStatus,
        closeReason: dto.closeReason,
        closedAt,
      },
      include: {
        stage: true,
        customer: true,
      },
    });

    await this.activityLogs.logEvent(
      organizationId,
      actorId,
      "OPPORTUNITY_STAGE_CHANGED",
      "Opportunity",
      id,
      { stageName: newStage?.name, status: newStatus },
    );

    return updated;
  }

  async deleteOpportunity(id: string, organizationId: string) {
    await this.getOpportunityById(id, organizationId);
    return this.prisma.opportunity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

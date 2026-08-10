import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ActivityLogsService } from "../../activity-logs/activity-logs.service";
import { CreateLeadDto, UpdateLeadDto, ConvertLeadDto } from "./dto/lead.dtos";
import { Prisma } from "@prisma/client";

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private async generateLeadNumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx || this.prisma;
    const year = new Date().getFullYear();
    const seq = await db.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "LEAD",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "LEAD", year, lastSequence: 1 },
    });
    return `LEAD-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async generateCustomerCode(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "CUST",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "CUST", year, lastSequence: 1 },
    });
    return `CUST-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async generateOpportunityNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
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
      sourceId?: string;
      pipelineId?: string;
      stageId?: string;
      assignedToId?: string;
    },
  ) {
    if (refs.sourceId) {
      const source = await this.prisma.leadSource.findFirst({
        where: { id: refs.sourceId, organizationId, deletedAt: null },
      });
      if (!source)
        throw new BadRequestException("Invalid or cross-tenant lead source");
    }
    if (refs.pipelineId) {
      const pipe = await this.prisma.crmPipeline.findFirst({
        where: { id: refs.pipelineId, organizationId, deletedAt: null },
      });
      if (!pipe)
        throw new BadRequestException("Invalid or cross-tenant CRM pipeline");
    }
    if (refs.stageId) {
      const stage = await this.prisma.crmPipelineStage.findFirst({
        where: { id: refs.stageId, organizationId },
      });
      if (!stage)
        throw new BadRequestException(
          "Invalid or cross-tenant CRM pipeline stage",
        );
    }
    if (refs.assignedToId) {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: refs.assignedToId, organizationId },
      });
      if (!member)
        throw new BadRequestException("Invalid or cross-tenant assigned user");
    }
  }

  async getLeads(
    organizationId: string,
    query?: {
      status?: string;
      stageId?: string;
      assignedToId?: string;
      search?: string;
    },
  ) {
    const where: Prisma.LeadWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (query?.status) where.status = query.status as any;
    if (query?.stageId) where.stageId = query.stageId;
    if (query?.assignedToId) where.assignedToId = query.assignedToId;
    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { companyName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
        { leadNumber: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        source: true,
        pipeline: true,
        stage: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        convertedCustomer: {
          select: { id: true, customerCode: true, name: true },
        },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLeadById(id: string, organizationId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        source: true,
        pipeline: true,
        stage: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        convertedCustomer: true,
        activities: { orderBy: { activityDate: "desc" } },
        tasks: { orderBy: { dueDate: "asc" } },
        crmNotes: { orderBy: { createdAt: "desc" } },
        tags: { include: { tag: true } },
        opportunities: true,
      },
    });

    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  async createLead(
    organizationId: string,
    actorId: string | null,
    dto: CreateLeadDto,
  ) {
    await this.validateCrossReferences(organizationId, dto);
    const leadNumber = await this.generateLeadNumber(organizationId);

    const lead = await this.prisma.lead.create({
      data: {
        organizationId,
        leadNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country || "India",
        sourceId: dto.sourceId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        assignedToId: dto.assignedToId,
        estimatedValue: dto.estimatedValue
          ? new Prisma.Decimal(dto.estimatedValue)
          : new Prisma.Decimal(0),
        currency: dto.currency || "INR",
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : null,
        notes: dto.notes,
        status: dto.status || "NEW",
      },
      include: {
        source: true,
        stage: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.activityLogs.logEvent(
      organizationId,
      actorId,
      "LEAD_CREATED",
      "Lead",
      lead.id,
      {
        leadNumber: lead.leadNumber,
        name: `${lead.firstName} ${lead.lastName || ""}`,
      },
    );

    return lead;
  }

  async updateLead(
    id: string,
    organizationId: string,
    actorId: string | null,
    dto: UpdateLeadDto,
  ) {
    const existing = await this.getLeadById(id, organizationId);
    await this.validateCrossReferences(organizationId, dto);

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        sourceId: dto.sourceId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        assignedToId: dto.assignedToId,
        estimatedValue:
          dto.estimatedValue !== undefined
            ? new Prisma.Decimal(dto.estimatedValue)
            : undefined,
        currency: dto.currency,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
        notes: dto.notes,
        status: dto.status,
      },
      include: {
        source: true,
        stage: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (dto.assignedToId && dto.assignedToId !== existing.assignedToId) {
      await this.activityLogs.logEvent(
        organizationId,
        actorId,
        "LEAD_ASSIGNED",
        "Lead",
        id,
        { assignedToId: dto.assignedToId },
      );
    }

    return updated;
  }

  async convertLead(
    id: string,
    organizationId: string,
    actorId: string | null,
    dto: ConvertLeadDto,
  ) {
    const lead = await this.getLeadById(id, organizationId);
    if (lead.status === "CONVERTED") {
      throw new BadRequestException("Lead has already been converted");
    }

    return this.prisma.$transaction(async (tx) => {
      let customerId: string;

      if (dto.existingCustomerId) {
        const cust = await tx.customer.findFirst({
          where: {
            id: dto.existingCustomerId,
            organizationId,
            deletedAt: null,
          },
        });
        if (!cust) throw new BadRequestException("Target customer not found");
        customerId = cust.id;
      } else {
        // Prevent duplicate customer by email or phone
        if (lead.email || lead.phone) {
          const duplicate = await tx.customer.findFirst({
            where: {
              organizationId,
              deletedAt: null,
              OR: [
                lead.email ? { email: lead.email } : {},
                lead.phone ? { phone: lead.phone } : {},
              ].filter((cond) => Object.keys(cond).length > 0),
            },
          });
          if (duplicate) {
            throw new BadRequestException(
              `A customer with matching email/phone already exists (${duplicate.customerCode} - ${duplicate.name}). Please select existing customer to avoid duplicates.`,
            );
          }
        }

        const customerCode =
          dto.customerCode ||
          (await this.generateCustomerCode(organizationId, tx));
        const custName =
          dto.customerName ||
          lead.companyName ||
          `${lead.firstName} ${lead.lastName || ""}`.trim();

        const newCustomer = await tx.customer.create({
          data: {
            organizationId,
            customerCode,
            name: custName,
            email: lead.email,
            phone: lead.phone,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            country: lead.country || "India",
            taxIdNumber: dto.taxIdNumber,
            notes: lead.notes,
          },
        });
        customerId = newCustomer.id;
      }

      // Mark Lead as CONVERTED
      await tx.lead.update({
        where: { id },
        data: {
          status: "CONVERTED",
          convertedCustomerId: customerId,
          convertedAt: new Date(),
        },
      });

      // Spawn Opportunity if requested
      let opportunityId: string | null = null;
      if (dto.createOpportunity) {
        let pipelineId = dto.pipelineId || lead.pipelineId;
        let stageId = dto.stageId || lead.stageId;

        if (!pipelineId || !stageId) {
          const defaultPipe = await tx.crmPipeline.findFirst({
            where: { organizationId, isDefault: true, deletedAt: null },
            include: { stages: { orderBy: { position: "asc" } } },
          });
          if (defaultPipe && defaultPipe.stages.length > 0) {
            pipelineId = defaultPipe.id;
            stageId = defaultPipe.stages[0].id;
          } else {
            const anyPipe = await tx.crmPipeline.findFirst({
              where: { organizationId, deletedAt: null },
              include: { stages: { orderBy: { position: "asc" } } },
            });
            if (!anyPipe || anyPipe.stages.length === 0) {
              throw new BadRequestException(
                "No CRM pipeline found to assign opportunity",
              );
            }
            pipelineId = anyPipe.id;
            stageId = anyPipe.stages[0].id;
          }
        }

        const oppNumber = await this.generateOpportunityNumber(
          organizationId,
          tx,
        );
        const oppName =
          dto.opportunityName ||
          `Opportunity from ${lead.firstName} ${lead.lastName || ""}`.trim();

        const opp = await tx.opportunity.create({
          data: {
            organizationId,
            opportunityNumber: oppNumber,
            customerId,
            leadId: lead.id,
            name: oppName,
            pipelineId,
            stageId,
            assignedToId: lead.assignedToId,
            estimatedValue: dto.estimatedValue
              ? new Prisma.Decimal(dto.estimatedValue)
              : lead.estimatedValue,
            currency: lead.currency,
          },
        });
        opportunityId = opp.id;
      }

      // Re-link or preserve activities/tasks to Customer and Opportunity
      await tx.crmActivity.updateMany({
        where: { leadId: id, organizationId },
        data: { customerId, opportunityId: opportunityId || undefined },
      });
      await tx.crmTask.updateMany({
        where: { leadId: id, organizationId },
        data: { customerId, opportunityId: opportunityId || undefined },
      });
      await tx.crmNote.updateMany({
        where: { leadId: id, organizationId },
        data: { customerId, opportunityId: opportunityId || undefined },
      });

      await this.activityLogs.logEvent(
        organizationId,
        actorId,
        "LEAD_CONVERTED",
        "Lead",
        id,
        { customerId, opportunityId },
      );

      return {
        leadId: id,
        customerId,
        opportunityId,
        status: "CONVERTED",
      };
    });
  }

  async deleteLead(id: string, organizationId: string) {
    await this.getLeadById(id, organizationId);
    return this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

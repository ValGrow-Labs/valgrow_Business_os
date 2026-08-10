import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateTagDto, AssignTagDto, UnassignTagDto } from "./dto/tag.dtos";

@Injectable()
export class CrmTagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTags(organizationId: string) {
    return this.prisma.crmTag.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  async createTag(organizationId: string, dto: CreateTagDto) {
    const existing = await this.prisma.crmTag.findFirst({
      where: { organizationId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(
        `Tag '${dto.name}' already exists in this organization`,
      );
    }

    return this.prisma.crmTag.create({
      data: {
        organizationId,
        name: dto.name,
        color: dto.color || "#3B82F6",
      },
    });
  }

  async assignTag(organizationId: string, dto: AssignTagDto) {
    const tag = await this.prisma.crmTag.findFirst({
      where: { id: dto.tagId, organizationId },
    });
    if (!tag) throw new NotFoundException("Tag not found");

    if (dto.customerId) {
      const cust = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, organizationId, deletedAt: null },
      });
      if (!cust) throw new BadRequestException("Invalid customer");
      return this.prisma.customerTag.upsert({
        where: {
          customerId_tagId: { customerId: dto.customerId, tagId: dto.tagId },
        },
        update: {},
        create: {
          organizationId,
          customerId: dto.customerId,
          tagId: dto.tagId,
        },
      });
    }

    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, organizationId, deletedAt: null },
      });
      if (!lead) throw new BadRequestException("Invalid lead");
      return this.prisma.leadTag.upsert({
        where: { leadId_tagId: { leadId: dto.leadId, tagId: dto.tagId } },
        update: {},
        create: { organizationId, leadId: dto.leadId, tagId: dto.tagId },
      });
    }

    if (dto.opportunityId) {
      const opp = await this.prisma.opportunity.findFirst({
        where: { id: dto.opportunityId, organizationId, deletedAt: null },
      });
      if (!opp) throw new BadRequestException("Invalid opportunity");
      return this.prisma.opportunityTag.upsert({
        where: {
          opportunityId_tagId: {
            opportunityId: dto.opportunityId,
            tagId: dto.tagId,
          },
        },
        update: {},
        create: {
          organizationId,
          opportunityId: dto.opportunityId,
          tagId: dto.tagId,
        },
      });
    }

    throw new BadRequestException(
      "Must specify customerId, leadId, or opportunityId",
    );
  }

  async unassignTag(organizationId: string, dto: UnassignTagDto) {
    if (dto.customerId) {
      return this.prisma.customerTag.deleteMany({
        where: { organizationId, customerId: dto.customerId, tagId: dto.tagId },
      });
    }
    if (dto.leadId) {
      return this.prisma.leadTag.deleteMany({
        where: { organizationId, leadId: dto.leadId, tagId: dto.tagId },
      });
    }
    if (dto.opportunityId) {
      return this.prisma.opportunityTag.deleteMany({
        where: {
          organizationId,
          opportunityId: dto.opportunityId,
          tagId: dto.tagId,
        },
      });
    }
    throw new BadRequestException(
      "Must specify customerId, leadId, or opportunityId",
    );
  }

  async deleteTag(id: string, organizationId: string) {
    const tag = await this.prisma.crmTag.findFirst({
      where: { id, organizationId },
    });
    if (!tag) throw new NotFoundException("Tag not found");

    return this.prisma.crmTag.delete({ where: { id } });
  }
}

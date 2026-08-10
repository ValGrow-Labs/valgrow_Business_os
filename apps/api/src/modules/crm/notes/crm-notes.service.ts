import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class CrmNotesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateCrossReferences(
    organizationId: string,
    refs: { customerId?: string; leadId?: string; opportunityId?: string },
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
  }

  async getNotes(
    organizationId: string,
    query?: { customerId?: string; leadId?: string; opportunityId?: string },
  ) {
    const where: Prisma.CrmNoteWhereInput = { organizationId, deletedAt: null };
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.leadId) where.leadId = query.leadId;
    if (query?.opportunityId) where.opportunityId = query.opportunityId;

    return this.prisma.crmNote.findMany({
      where,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createNote(
    organizationId: string,
    authorId: string,
    dto: CreateNoteDto,
  ) {
    await this.validateCrossReferences(organizationId, dto);

    return this.prisma.crmNote.create({
      data: {
        organizationId,
        content: dto.content,
        authorId,
        customerId: dto.customerId,
        leadId: dto.leadId,
        opportunityId: dto.opportunityId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async deleteNote(id: string, organizationId: string) {
    const note = await this.prisma.crmNote.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!note) throw new NotFoundException("Note not found");

    return this.prisma.crmNote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

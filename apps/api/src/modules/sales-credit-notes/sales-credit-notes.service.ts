import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JournalEntriesService } from "../journal-entries/journal-entries.service";
import {
  CreateSalesCreditNoteDto,
  UpdateSalesCreditNoteDto,
} from "./dto/create-sales-credit-note.dto";
import { Prisma, SalesCreditNoteStatus } from "@prisma/client";

@Injectable()
export class SalesCreditNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  private async generateCNNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "CN",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "CN", year, lastSequence: 1 },
    });
    return `CN-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  async getSalesCreditNotes(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.salesCreditNote.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        salesInvoice: { select: { id: true, invoiceNumber: true } },
        salesReturn: { select: { id: true, returnNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSalesCreditNoteById(id: string, organizationId: string) {
    const cn = await this.prisma.salesCreditNote.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        salesInvoice: true,
        salesReturn: true,
      },
    });
    if (!cn) throw new NotFoundException("Sales credit note not found");
    return cn;
  }

  async createSalesCreditNote(
    organizationId: string,
    dto: CreateSalesCreditNoteDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });
    if (!customer) {
      throw new BadRequestException("Customer not found in this organization");
    }

    if (dto.salesInvoiceId) {
      const inv = await this.prisma.salesInvoice.findFirst({
        where: { id: dto.salesInvoiceId, organizationId },
      });
      if (!inv) throw new BadRequestException("Sales invoice not found");
    }

    if (dto.salesReturnId) {
      const sr = await this.prisma.salesReturn.findFirst({
        where: { id: dto.salesReturnId, organizationId },
      });
      if (!sr) throw new BadRequestException("Sales return not found");
    }

    const amt = new Prisma.Decimal(dto.amount);
    const tax = new Prisma.Decimal(dto.taxAmount ?? 0);
    const total = amt.add(tax);

    return this.prisma.$transaction(async (tx) => {
      const creditNoteNumber = await this.generateCNNumber(organizationId, tx);

      return tx.salesCreditNote.create({
        data: {
          organizationId,
          creditNoteNumber,
          customerId: dto.customerId,
          salesInvoiceId: dto.salesInvoiceId || null,
          salesReturnId: dto.salesReturnId || null,
          creditDate: dto.creditDate ? new Date(dto.creditDate) : new Date(),
          amount: amt,
          taxAmount: tax,
          totalAmount: total,
          reason: dto.reason,
          status: "DRAFT",
        },
      });
    });
  }

  async updateSalesCreditNote(
    id: string,
    organizationId: string,
    dto: UpdateSalesCreditNoteDto,
  ) {
    const cn = await this.getSalesCreditNoteById(id, organizationId);
    if (cn.status !== "DRAFT") {
      throw new BadRequestException("Only DRAFT credit notes can be edited");
    }
    return this.prisma.salesCreditNote.update({
      where: { id },
      data: {
        reason: dto.reason,
        status: dto.status,
      },
    });
  }

  private async transitionCN(
    id: string,
    organizationId: string,
    actorId: string,
    targetStatus: SalesCreditNoteStatus,
  ) {
    const cn = await this.getSalesCreditNoteById(id, organizationId);
    
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.salesCreditNote.update({
        where: { id },
        data: { status: targetStatus },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: `CREDIT_NOTE_${targetStatus}`,
          entityType: "SalesCreditNote",
          entityId: id,
          metadata: { from: cn.status, to: targetStatus },
        },
      });

      if (targetStatus === "ISSUED" || targetStatus === "APPLIED") {
        const amt = Number(cn.amount);
        const tax = Number(cn.taxAmount);
        const total = Number(cn.totalAmount);

        const salesReturnsId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "SALES_RETURNS", "4030");
        const outputTaxId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "OUTPUT_TAX", "2020");
        const arId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "ACCOUNTS_RECEIVABLE", "1020");

        const lines = [
          { accountId: salesReturnsId, debit: amt, credit: 0, customerId: cn.customerId },
          ...(tax > 0 ? [{ accountId: outputTaxId, debit: tax, credit: 0, customerId: cn.customerId }] : []),
          { accountId: arId, debit: 0, credit: total, customerId: cn.customerId },
        ];

        await this.journalEntriesService.postOperationalJournal(tx, {
          orgId: organizationId,
          userId: actorId,
          sourceModule: "SALES",
          referenceType: "SalesCreditNote",
          referenceId: cn.id,
          description: `Sales Credit Note: ${cn.creditNoteNumber}`,
          postingDate: cn.creditDate || new Date(),
          lines,
        });
      }

      return updated;
    });
  }

  issue(id: string, orgId: string, actorId: string) {
    return this.transitionCN(id, orgId, actorId, "ISSUED");
  }
  apply(id: string, orgId: string, actorId: string) {
    return this.transitionCN(id, orgId, actorId, "APPLIED");
  }
  cancel(id: string, orgId: string, actorId: string) {
    return this.transitionCN(id, orgId, actorId, "CANCELLED");
  }
}

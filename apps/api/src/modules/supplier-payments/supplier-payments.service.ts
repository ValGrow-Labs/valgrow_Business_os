import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JournalEntriesService } from "../journal-entries/journal-entries.service";
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  private async generatePaymentNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "PAY",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "PAY", year, lastSequence: 1 },
    });
    return `PAY-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  async getPayments(organizationId: string) {
    return this.prisma.supplierPayment.findMany({
      where: { organizationId },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPaymentById(id: string, organizationId: string) {
    const payment = await this.prisma.supplierPayment.findFirst({
      where: { id, organizationId },
      include: {
        supplier: true,
        invoice: true,
      },
    });
    if (!payment) throw new NotFoundException("Supplier payment not found");
    return payment;
  }

  async createPayment(organizationId: string, dto: CreateSupplierPaymentDto, actorId?: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, organizationId, deletedAt: null },
    });
    if (!supplier)
      throw new BadRequestException("Supplier not found in this organization");

    const paymentAmount = new Prisma.Decimal(dto.amount);

    let invoice: any = null;
    if (dto.supplierInvoiceId) {
      invoice = await this.prisma.supplierInvoice.findFirst({
        where: { id: dto.supplierInvoiceId, organizationId },
      });
      if (!invoice)
        throw new BadRequestException("Supplier invoice not found");
      if (invoice.supplierId !== dto.supplierId) {
        throw new BadRequestException(
          "Invoice does not belong to this supplier",
        );
      }
      if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
        throw new BadRequestException(
          `Cannot add payment to invoice with status ${invoice.status}`,
        );
      }
      const remaining = invoice.totalAmount.sub(invoice.paidAmount);
      if (paymentAmount.gt(remaining)) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds remaining invoice balance (${remaining.toString()})`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const paymentNumber = await this.generatePaymentNumber(
        organizationId,
        tx,
      );

      const payment = await tx.supplierPayment.create({
        data: {
          organizationId,
          supplierId: dto.supplierId,
          supplierInvoiceId: dto.supplierInvoiceId || null,
          paymentNumber,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          amount: paymentAmount,
          paymentMethod: dto.paymentMethod,
          referenceNumber: dto.referenceNumber || null,
          notes: dto.notes || null,
        },
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
      });

      if (invoice) {
        const newPaid = invoice.paidAmount.add(paymentAmount);
        const isFullyPaid = newPaid.gte(invoice.totalAmount);
        await tx.supplierInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaid,
            status: isFullyPaid ? "PAID" : "PARTIALLY_PAID",
          },
        });
      }

      // Post GL Entry
      const amt = Number(dto.amount);
      const isCash = dto.paymentMethod === "CASH";
      const apId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "ACCOUNTS_PAYABLE", "2010");
      const bankOrCashId = isCash
        ? await this.journalEntriesService.getMappedAccountId(tx, organizationId, "CASH", "1011")
        : await this.journalEntriesService.getMappedAccountId(tx, organizationId, "BANK", "1012");

      const lines = [
        { accountId: apId, debit: amt, credit: 0, supplierId: dto.supplierId },
        { accountId: bankOrCashId, debit: 0, credit: amt, supplierId: dto.supplierId },
      ];

      let effectiveUserId = actorId;
      if (!effectiveUserId) {
        const member = await tx.organizationMember.findFirst({ where: { organizationId } });
        effectiveUserId = member?.userId || "";
      }

      await this.journalEntriesService.postOperationalJournal(tx, {
        orgId: organizationId,
        userId: effectiveUserId,
        sourceModule: "PURCHASING",
        referenceType: "SupplierPayment",
        referenceId: payment.id,
        description: `Supplier Payment: ${payment.paymentNumber}`,
        postingDate: payment.paymentDate,
        lines,
      });

      return payment;
    });
  }
}

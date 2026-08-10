import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JournalEntriesService } from "../journal-entries/journal-entries.service";
import { CreateCustomerPaymentDto } from "./dto/create-customer-payment.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class CustomerPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  private async generatePAYNumber(
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

  async getCustomerPayments(organizationId: string, customerId?: string) {
    const where: any = { organizationId };
    if (customerId) where.customerId = customerId;
    return this.prisma.customerPayment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCustomerPaymentById(id: string, organizationId: string) {
    const payment = await this.prisma.customerPayment.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        invoice: true,
      },
    });
    if (!payment) throw new NotFoundException("Customer payment not found");
    return payment;
  }

  async createCustomerPayment(
    organizationId: string,
    actorId: string,
    dto: CreateCustomerPaymentDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });
    if (!customer) {
      throw new BadRequestException("Customer not found in this organization");
    }

    const payAmount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(async (tx) => {
      let invoice = null;
      if (dto.salesInvoiceId) {
        invoice = await tx.salesInvoice.findFirst({
          where: { id: dto.salesInvoiceId, organizationId },
        });
        if (!invoice) {
          throw new BadRequestException(
            "Sales invoice not found in this organization",
          );
        }
        if (invoice.customerId !== dto.customerId) {
          throw new BadRequestException(
            "Sales invoice does not belong to the specified customer",
          );
        }

        const remainingBalance = invoice.totalAmount.sub(invoice.paidAmount);
        if (payAmount.gt(remainingBalance)) {
          throw new BadRequestException(
            `Payment amount (${payAmount}) exceeds remaining invoice balance (${remainingBalance})`,
          );
        }
      }

      const paymentNumber = await this.generatePAYNumber(organizationId, tx);

      const payment = await tx.customerPayment.create({
        data: {
          organizationId,
          paymentNumber,
          customerId: dto.customerId,
          salesInvoiceId: dto.salesInvoiceId || null,
          amount: payAmount,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          paymentMethod: dto.paymentMethod || "BANK_TRANSFER",
          referenceNumber: dto.referenceNumber,
          notes: dto.notes,
        },
      });

      if (invoice) {
        const newPaid = invoice.paidAmount.add(payAmount);
        const isFullyPaid = newPaid.gte(invoice.totalAmount);
        await tx.salesInvoice.update({
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
      const bankOrCashId = isCash
        ? await this.journalEntriesService.getMappedAccountId(tx, organizationId, "CASH", "1011")
        : await this.journalEntriesService.getMappedAccountId(tx, organizationId, "BANK", "1012");
      const arId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "ACCOUNTS_RECEIVABLE", "1020");

      const lines = [
        { accountId: bankOrCashId, debit: amt, credit: 0, customerId: dto.customerId },
        { accountId: arId, debit: 0, credit: amt, customerId: dto.customerId },
      ];

      await this.journalEntriesService.postOperationalJournal(tx, {
        orgId: organizationId,
        userId: actorId,
        sourceModule: "SALES",
        referenceType: "CustomerPayment",
        referenceId: payment.id,
        description: `Customer Payment: ${payment.paymentNumber}`,
        postingDate: payment.paymentDate,
        lines,
      });

      return payment;
    });
  }
}

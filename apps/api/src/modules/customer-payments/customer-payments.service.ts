import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCustomerPaymentDto } from "./dto/create-customer-payment.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class CustomerPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

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
        const newPaidAmount = invoice.paidAmount.add(payAmount);
        const newStatus = newPaidAmount.gte(invoice.totalAmount)
          ? "PAID"
          : "PARTIALLY_PAID";

        await tx.salesInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "PAYMENT_RECORDED",
          entityType: "CustomerPayment",
          entityId: payment.id,
          metadata: {
            paymentNumber,
            amount: payAmount.toString(),
            invoiceId: dto.salesInvoiceId,
          },
        },
      });

      return payment;
    });
  }
}

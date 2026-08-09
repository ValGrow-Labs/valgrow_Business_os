import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createPayment(organizationId: string, dto: CreateSupplierPaymentDto) {
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
        throw new BadRequestException("Invoice not found in this organization");
      if (invoice.supplierId !== dto.supplierId) {
        throw new BadRequestException(
          "Invoice does not belong to this supplier",
        );
      }
      if (invoice.status === "PAID") {
        throw new BadRequestException("Invoice is already fully paid");
      }

      const outstanding = invoice.totalAmount.sub(invoice.paidAmount);
      if (paymentAmount.gt(outstanding)) {
        throw new BadRequestException(
          `Payment amount (${paymentAmount}) exceeds outstanding balance (${outstanding})`,
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
          paymentNumber,
          supplierId: dto.supplierId,
          supplierInvoiceId: dto.supplierInvoiceId || null,
          amount: paymentAmount,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          paymentMethod: (dto.paymentMethod as any) || "BANK_TRANSFER",
          referenceNumber: dto.referenceNumber,
          notes: dto.notes,
        },
        include: {
          supplier: { select: { id: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
      });

      if (invoice) {
        const newPaidAmount = invoice.paidAmount.add(paymentAmount);
        const newStatus = newPaidAmount.gte(invoice.totalAmount)
          ? "PAID"
          : "PARTIALLY_PAID";

        await tx.supplierInvoice.update({
          where: { id: invoice.id },
          data: { paidAmount: newPaidAmount, status: newStatus },
        });
      }

      return payment;
    });
  }
}

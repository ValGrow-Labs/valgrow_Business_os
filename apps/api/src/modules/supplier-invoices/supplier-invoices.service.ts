import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateSupplierInvoiceDto,
  UpdateSupplierInvoiceDto,
} from "./dto/supplier-invoice.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierInvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "PINV",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "PINV", year, lastSequence: 1 },
    });
    return `PINV-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  async getInvoices(organizationId: string) {
    return this.prisma.supplierInvoice.findMany({
      where: { organizationId },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        purchaseOrder: { select: { id: true, orderNumber: true } },
        payments: { select: { id: true, amount: true, paymentDate: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getInvoiceById(id: string, organizationId: string) {
    const invoice = await this.prisma.supplierInvoice.findFirst({
      where: { id, organizationId },
      include: {
        supplier: true,
        purchaseOrder: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
        payments: true,
      },
    });
    if (!invoice) throw new NotFoundException("Supplier invoice not found");
    return invoice;
  }

  async createInvoice(organizationId: string, dto: CreateSupplierInvoiceDto) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, organizationId, deletedAt: null },
    });
    if (!supplier)
      throw new BadRequestException("Supplier not found in this organization");

    if (dto.purchaseOrderId) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { id: dto.purchaseOrderId, organizationId },
      });
      if (!po)
        throw new BadRequestException(
          "Purchase order not found in this organization",
        );
      if (po.supplierId !== dto.supplierId) {
        throw new BadRequestException(
          "Supplier does not match the purchase order",
        );
      }
    }

    const existing = await this.prisma.supplierInvoice.findFirst({
      where: { organizationId, invoiceNumber: dto.invoiceNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Invoice number '${dto.invoiceNumber}' already exists in this organization`,
      );
    }

    return this.prisma.supplierInvoice.create({
      data: {
        organizationId,
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId || null,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: new Date(dto.dueDate),
        currency: dto.currency || "INR",
        exchangeRate: new Prisma.Decimal(dto.exchangeRate ?? 1),
        subtotalAmount: new Prisma.Decimal(dto.subtotalAmount),
        taxAmount: new Prisma.Decimal(dto.taxAmount ?? 0),
        totalAmount: new Prisma.Decimal(dto.totalAmount),
        paidAmount: new Prisma.Decimal(0),
        status: "UNPAID",
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async updateInvoice(
    id: string,
    organizationId: string,
    dto: UpdateSupplierInvoiceDto,
  ) {
    await this.getInvoiceById(id, organizationId);
    return this.prisma.supplierInvoice.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async threeWayMatch(invoiceId: string, organizationId: string) {
    const invoice = await this.getInvoiceById(invoiceId, organizationId);
    if (!invoice.purchaseOrderId) {
      return {
        matched: false,
        mismatches: ["No purchase order linked to this invoice"],
      };
    }

    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: invoice.purchaseOrderId, organizationId },
      include: {
        items: true,
        goodsReceipts: {
          where: { status: "POSTED" },
          include: { items: true },
        },
      },
    });

    if (!po) {
      return { matched: false, mismatches: ["Purchase order not found"] };
    }

    const mismatches: string[] = [];

    if (po.supplierId !== invoice.supplierId) {
      mismatches.push(
        `Supplier mismatch: PO supplier (${po.supplierId}) vs Invoice supplier (${invoice.supplierId})`,
      );
    }

    if (!po.totalAmount.equals(invoice.totalAmount)) {
      mismatches.push(
        `Amount mismatch: PO total (${po.totalAmount}) vs Invoice total (${invoice.totalAmount})`,
      );
    }

    const totalReceived = po.goodsReceipts
      .flatMap((g) => g.items)
      .reduce((sum, i) => sum.add(i.receivedQty), new Prisma.Decimal(0));

    const totalOrdered = po.items.reduce(
      (sum, i) => sum.add(i.orderedQty),
      new Prisma.Decimal(0),
    );

    if (totalReceived.lt(totalOrdered)) {
      mismatches.push(
        `Partial receipt: ordered (${totalOrdered}) vs received (${totalReceived})`,
      );
    }

    return {
      matched: mismatches.length === 0,
      mismatches,
      summary: {
        poTotal: po.totalAmount,
        invoiceTotal: invoice.totalAmount,
        totalOrdered,
        totalReceived,
      },
    };
  }
}

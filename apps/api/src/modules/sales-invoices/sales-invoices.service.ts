import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JournalEntriesService } from "../journal-entries/journal-entries.service";
import { CreateSalesInvoiceDto } from "./dto/create-sales-invoice.dto";
import { UpdateSalesInvoiceDto } from "./dto/update-sales-invoice.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesInvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  private async generateSINVNumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx || this.prisma;
    const year = new Date().getFullYear();
    const seq = await db.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "SINV",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "SINV", year, lastSequence: 1 },
    });
    return `SINV-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  async getSalesInvoices(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.salesInvoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        salesOrder: { select: { id: true, orderNumber: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSalesInvoiceById(id: string, organizationId: string) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        salesOrder: { select: { id: true, orderNumber: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
        customerPayments: true,
        salesReturns: true,
        salesCreditNotes: true,
      },
    });
    if (!invoice) throw new NotFoundException("Sales invoice not found");
    return invoice;
  }

  async createSalesInvoice(organizationId: string, dto: CreateSalesInvoiceDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "Sales invoice must contain at least one item",
      );
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });
    if (!customer) {
      throw new BadRequestException("Customer not found in this organization");
    }

    if (dto.salesOrderId) {
      const so = await this.prisma.salesOrder.findFirst({
        where: { id: dto.salesOrderId, organizationId },
      });
      if (!so) {
        throw new BadRequestException(
          "Sales order not found in this organization",
        );
      }
    }

    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, organizationId, deletedAt: null },
      });
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} not found in this organization`,
        );
      }

      if (item.variantId) {
        const variant = await this.prisma.productVariant.findFirst({
          where: { id: item.variantId, organizationId, deletedAt: null },
        });
        if (!variant) {
          throw new BadRequestException(`Variant ${item.variantId} not found`);
        }
        if (variant.productId !== item.productId) {
          throw new BadRequestException(
            `Variant ${item.variantId} does not belong to product ${item.productId}`,
          );
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateSINVNumber(organizationId, tx);

      let subtotal = new Prisma.Decimal(0);
      let taxTotal = new Prisma.Decimal(0);

      const itemsData = dto.items.map((i) => {
        const qty = new Prisma.Decimal(i.quantity);
        const price = new Prisma.Decimal(i.unitPrice);
        const taxRate = new Prisma.Decimal(i.taxRate ?? 0);
        const discount = new Prisma.Decimal(i.discountAmount ?? 0);
        const lineSubtotal = qty.mul(price).sub(discount);
        const taxAmount = lineSubtotal.mul(taxRate).div(100);
        const lineTotal = lineSubtotal.add(taxAmount);

        subtotal = subtotal.add(lineSubtotal);
        taxTotal = taxTotal.add(taxAmount);

        return {
          organizationId,
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: qty,
          unitPrice: price,
          taxRate,
          taxAmount,
          discountAmount: discount,
          totalAmount: lineTotal,
        };
      });

      const totalAmount = subtotal.add(taxTotal);

      return tx.salesInvoice.create({
        data: {
          organizationId,
          invoiceNumber,
          customerId: dto.customerId,
          salesOrderId: dto.salesOrderId || null,
          invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : new Date(),
          dueDate: new Date(dto.dueDate),
          currency: dto.currency || "INR",
          exchangeRate: new Prisma.Decimal(dto.exchangeRate ?? 1),
          subtotalAmount: subtotal,
          discountAmount: new Prisma.Decimal(0),
          taxAmount: taxTotal,
          totalAmount,
          paidAmount: new Prisma.Decimal(0),
          status: "DRAFT",
          items: { create: itemsData },
        },
        include: { items: true },
      });
    });
  }

  async updateSalesInvoice(
    id: string,
    organizationId: string,
    dto: UpdateSalesInvoiceDto,
  ) {
    const invoice = await this.getSalesInvoiceById(id, organizationId);
    if (invoice.status !== "DRAFT") {
      throw new BadRequestException("Only DRAFT invoices can be edited");
    }
    return this.prisma.salesInvoice.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { items: true },
    });
  }

  async postSalesInvoice(id: string, organizationId: string, actorId: string) {
    const invoice = await this.getSalesInvoiceById(id, organizationId);
    if (invoice.status !== "DRAFT") {
      throw new BadRequestException(
        `Invoice is already ${invoice.status} and cannot be posted`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.salesInvoice.update({
        where: { id },
        data: { status: "POSTED" },
        include: { items: true },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "INVOICE_POSTED",
          entityType: "SalesInvoice",
          entityId: id,
          metadata: { invoiceNumber: invoice.invoiceNumber },
        },
      });

      // Post GL Entry
      const subtotal = Number(invoice.subtotalAmount);
      const tax = Number(invoice.taxAmount);
      const total = Number(invoice.totalAmount);

      const arId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "ACCOUNTS_RECEIVABLE", "1020");
      const salesRevId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "SALES_REVENUE", "4010");
      const outputTaxId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "OUTPUT_TAX", "2020");

      const lines = [
        { accountId: arId, debit: total, credit: 0, customerId: invoice.customerId },
        { accountId: salesRevId, debit: 0, credit: subtotal, customerId: invoice.customerId },
        ...(tax > 0 ? [{ accountId: outputTaxId, debit: 0, credit: tax, customerId: invoice.customerId }] : []),
      ];

      await this.journalEntriesService.postOperationalJournal(tx, {
        orgId: organizationId,
        userId: actorId,
        sourceModule: "SALES",
        referenceType: "SalesInvoice",
        referenceId: invoice.id,
        description: `Sales Invoice: ${invoice.invoiceNumber}`,
        postingDate: invoice.invoiceDate,
        lines,
      });

      return updated;
    });
  }

  async cancelSalesInvoice(
    id: string,
    organizationId: string,
    actorId: string,
  ) {
    const invoice = await this.getSalesInvoiceById(id, organizationId);
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      throw new BadRequestException(
        `Cannot cancel invoice in ${invoice.status} status`,
      );
    }
    const cancelled = await this.prisma.salesInvoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action: "INVOICE_CANCELLED",
        entityType: "SalesInvoice",
        entityId: id,
      },
    });
    return cancelled;
  }
}

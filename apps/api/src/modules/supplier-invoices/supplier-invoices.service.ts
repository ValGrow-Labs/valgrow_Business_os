import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JournalEntriesService } from "../journal-entries/journal-entries.service";
import {
  CreateSupplierInvoiceDto,
  UpdateSupplierInvoiceDto,
} from "./dto/supplier-invoice.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierInvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

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

  async createInvoice(organizationId: string, dto: CreateSupplierInvoiceDto, actorId?: string) {
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

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.supplierInvoice.create({
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

      // Post GL Journal Entry
      const subtotal = Number(dto.subtotalAmount);
      const tax = Number(dto.taxAmount || 0);
      const total = Number(dto.totalAmount);

      const purchaseClearingId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "PURCHASE_CLEARING", "1053");
      const inputTaxId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "INPUT_TAX", "1040");
      const apId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "ACCOUNTS_PAYABLE", "2010");

      const lines = [
        { accountId: purchaseClearingId, debit: subtotal, credit: 0, supplierId: dto.supplierId },
        ...(tax > 0 ? [{ accountId: inputTaxId, debit: tax, credit: 0, supplierId: dto.supplierId }] : []),
        { accountId: apId, debit: 0, credit: total, supplierId: dto.supplierId },
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
        referenceType: "SupplierInvoice",
        referenceId: invoice.id,
        description: `Supplier Invoice: ${invoice.invoiceNumber}`,
        postingDate: new Date(dto.invoiceDate),
        lines,
      });

      return invoice;
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
        reason: "No purchase order linked to this invoice",
        details: null,
      };
    }

    const po = invoice.purchaseOrder;
    if (!po) {
      return {
        matched: false,
        reason: "Linked purchase order not found",
        details: null,
      };
    }

    const grns = await this.prisma.goodsReceipt.findMany({
      where: { purchaseOrderId: po.id, organizationId, status: "POSTED" },
      include: { items: true },
    });

    const poSubtotal = Number(po.subtotalAmount);
    const invSubtotal = Number(invoice.subtotalAmount);

    let grnSubtotal = 0;
    for (const g of grns) {
      for (const item of g.items) {
        grnSubtotal += Number(item.totalCost);
      }
    }

    const poMatch = Math.abs(poSubtotal - invSubtotal) < 0.01;
    const grnMatch = Math.abs(grnSubtotal - invSubtotal) < 0.01;

    return {
      matched: poMatch && grnMatch,
      reason:
        poMatch && grnMatch
          ? "3-Way Match Successful (PO, GRN, Invoice amounts align)"
          : "Discrepancy detected between PO, GRN, or Invoice totals",
      details: {
        poNumber: po.orderNumber,
        poSubtotal,
        invSubtotal,
        grnSubtotal,
        poMatch,
        grnMatch,
      },
    };
  }
}

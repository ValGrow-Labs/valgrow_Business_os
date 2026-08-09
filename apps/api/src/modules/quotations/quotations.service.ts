import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { UpdateQuotationDto } from "./dto/update-quotation.dto";
import { QuotationActionDto } from "./dto/quotation-action.dto";
import { Prisma, QuotationStatus } from "@prisma/client";

const VALID_QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> =
  {
    DRAFT: ["SENT", "CANCELLED"],
    SENT: ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
    ACCEPTED: ["CONVERTED", "CANCELLED"],
    CONVERTED: [],
    REJECTED: [],
    EXPIRED: [],
    CANCELLED: [],
  };

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateQuotationNumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx || this.prisma;
    const year = new Date().getFullYear();
    const seq = await db.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "QUO",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "QUO", year, lastSequence: 1 },
    });
    return `QUO-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async generateSONumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "SO",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "SO", year, lastSequence: 1 },
    });
    return `SO-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async validateQuotationSetup(
    organizationId: string,
    dto: CreateQuotationDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });
    if (!customer) {
      throw new BadRequestException("Customer not found in this organization");
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, organizationId, deletedAt: null },
      });
      if (!branch) {
        throw new BadRequestException("Branch not found in this organization");
      }
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });
    if (!warehouse) {
      throw new BadRequestException("Warehouse not found in this organization");
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
          throw new BadRequestException(
            `Variant ${item.variantId} not found in this organization`,
          );
        }
        if (variant.productId !== item.productId) {
          throw new BadRequestException(
            `Variant ${item.variantId} does not belong to product ${item.productId}`,
          );
        }
      }
    }
  }

  async getQuotations(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
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

  async getQuotationById(id: string, organizationId: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
        salesOrders: { select: { id: true, orderNumber: true, status: true } },
      },
    });
    if (!quotation) throw new NotFoundException("Quotation not found");
    return quotation;
  }

  async createQuotation(organizationId: string, dto: CreateQuotationDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Quotation must contain at least one item");
    }
    await this.validateQuotationSetup(organizationId, dto);

    return this.prisma.$transaction(async (tx) => {
      const quotationNumber = await this.generateQuotationNumber(
        organizationId,
        tx,
      );

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

      return tx.quotation.create({
        data: {
          organizationId,
          quotationNumber,
          customerId: dto.customerId,
          branchId: dto.branchId || null,
          warehouseId: dto.warehouseId,
          quotationDate: dto.quotationDate
            ? new Date(dto.quotationDate)
            : new Date(),
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          currency: dto.currency || "INR",
          exchangeRate: new Prisma.Decimal(dto.exchangeRate ?? 1),
          subtotalAmount: subtotal,
          discountAmount: new Prisma.Decimal(0),
          taxAmount: taxTotal,
          totalAmount,
          notes: dto.notes,
          status: "DRAFT",
          items: { create: itemsData },
        },
        include: {
          items: true,
          customer: { select: { id: true, name: true, customerCode: true } },
        },
      });
    });
  }

  async updateQuotation(
    id: string,
    organizationId: string,
    dto: UpdateQuotationDto,
  ) {
    const quotation = await this.getQuotationById(id, organizationId);
    if (quotation.status !== "DRAFT") {
      throw new BadRequestException("Only DRAFT quotations can be edited");
    }
    return this.prisma.quotation.update({
      where: { id },
      data: {
        notes: dto.notes,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
      include: { items: true },
    });
  }

  private async transitionQuotation(
    id: string,
    organizationId: string,
    actorId: string,
    targetStatus: QuotationStatus,
    dto?: QuotationActionDto,
  ) {
    const quotation = await this.getQuotationById(id, organizationId);
    const current = quotation.status;
    const allowed = VALID_QUOTATION_TRANSITIONS[current] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition quotation from ${current} to ${targetStatus}`,
      );
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: targetStatus },
      include: { items: true },
    });

    await this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action: `QUOTATION_${targetStatus}`,
        entityType: "Quotation",
        entityId: id,
        metadata: { from: current, to: targetStatus, notes: dto?.notes },
      },
    });

    return updated;
  }

  send(id: string, orgId: string, actorId: string, dto?: QuotationActionDto) {
    return this.transitionQuotation(id, orgId, actorId, "SENT", dto);
  }
  accept(id: string, orgId: string, actorId: string, dto?: QuotationActionDto) {
    return this.transitionQuotation(id, orgId, actorId, "ACCEPTED", dto);
  }
  reject(id: string, orgId: string, actorId: string, dto?: QuotationActionDto) {
    return this.transitionQuotation(id, orgId, actorId, "REJECTED", dto);
  }
  expire(id: string, orgId: string, actorId: string, dto?: QuotationActionDto) {
    return this.transitionQuotation(id, orgId, actorId, "EXPIRED", dto);
  }
  cancel(id: string, orgId: string, actorId: string, dto?: QuotationActionDto) {
    return this.transitionQuotation(id, orgId, actorId, "CANCELLED", dto);
  }

  async convertToSalesOrder(
    id: string,
    organizationId: string,
    actorId: string,
  ) {
    const quotation = await this.getQuotationById(id, organizationId);
    if (quotation.status !== "ACCEPTED") {
      throw new BadRequestException(
        `Only ACCEPTED quotations can be converted to a Sales Order (current status: ${quotation.status})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const soNumber = await this.generateSONumber(organizationId, tx);

      const itemsData = quotation.items.map((i) => ({
        organizationId,
        productId: i.productId,
        variantId: i.variantId,
        orderedQty: i.quantity,
        deliveredQty: new Prisma.Decimal(0),
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        taxAmount: i.taxAmount,
        discountAmount: i.discountAmount,
        totalAmount: i.totalAmount,
      }));

      const salesOrder = await tx.salesOrder.create({
        data: {
          organizationId,
          orderNumber: soNumber,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          branchId: quotation.branchId,
          warehouseId: quotation.warehouseId,
          currency: quotation.currency,
          exchangeRate: quotation.exchangeRate,
          subtotalAmount: quotation.subtotalAmount,
          discountAmount: quotation.discountAmount,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          notes: quotation.notes,
          status: "DRAFT",
          items: { create: itemsData },
        },
        include: { items: true },
      });

      await tx.quotation.update({
        where: { id },
        data: { status: "CONVERTED" },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "QUOTATION_CONVERTED",
          entityType: "Quotation",
          entityId: id,
          metadata: { salesOrderId: salesOrder.id, salesOrderNumber: soNumber },
        },
      });

      return salesOrder;
    });
  }
}

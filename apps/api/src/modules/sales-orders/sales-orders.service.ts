import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";
import { UpdateSalesOrderDto } from "./dto/update-sales-order.dto";
import { SalesOrderActionDto } from "./dto/sales-order-action.dto";
import { Prisma, SalesOrderStatus } from "@prisma/client";

const VALID_SO_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PARTIALLY_DELIVERED", "DELIVERED", "CANCELLED"],
  PARTIALLY_DELIVERED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class SalesOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateSONumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx || this.prisma;
    const year = new Date().getFullYear();
    const seq = await db.documentSequence.upsert({
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

  private async validateSOSetup(
    organizationId: string,
    dto: CreateSalesOrderDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });
    if (!customer) {
      throw new BadRequestException("Customer not found in this organization");
    }

    if (dto.quotationId) {
      const quotation = await this.prisma.quotation.findFirst({
        where: { id: dto.quotationId, organizationId },
      });
      if (!quotation) {
        throw new BadRequestException(
          "Quotation not found in this organization",
        );
      }
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

  async getSalesOrders(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.salesOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
        quotation: { select: { id: true, quotationNumber: true } },
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

  async getSalesOrderById(id: string, organizationId: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        warehouse: true,
        branch: true,
        quotation: { select: { id: true, quotationNumber: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
        deliveryNotes: {
          select: { id: true, deliveryNumber: true, status: true },
        },
        salesInvoices: {
          select: { id: true, invoiceNumber: true, status: true },
        },
      },
    });
    if (!order) throw new NotFoundException("Sales order not found");
    return order;
  }

  async createSalesOrder(organizationId: string, dto: CreateSalesOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "Sales order must contain at least one item",
      );
    }
    await this.validateSOSetup(organizationId, dto);

    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.generateSONumber(organizationId, tx);

      let subtotal = new Prisma.Decimal(0);
      let taxTotal = new Prisma.Decimal(0);

      const itemsData = dto.items.map((i) => {
        const qty = new Prisma.Decimal(i.orderedQty);
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
          orderedQty: qty,
          deliveredQty: new Prisma.Decimal(0),
          unitPrice: price,
          taxRate,
          taxAmount,
          discountAmount: discount,
          totalAmount: lineTotal,
        };
      });

      const totalAmount = subtotal.add(taxTotal);

      return tx.salesOrder.create({
        data: {
          organizationId,
          orderNumber,
          customerId: dto.customerId,
          quotationId: dto.quotationId || null,
          branchId: dto.branchId || null,
          warehouseId: dto.warehouseId,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          currency: dto.currency || "INR",
          exchangeRate: new Prisma.Decimal(dto.exchangeRate ?? 1),
          paymentTerms: dto.paymentTerms || "NET30",
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

  async updateSalesOrder(
    id: string,
    organizationId: string,
    dto: UpdateSalesOrderDto,
  ) {
    const order = await this.getSalesOrderById(id, organizationId);
    if (order.status !== "DRAFT") {
      throw new BadRequestException("Only DRAFT sales orders can be edited");
    }
    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        notes: dto.notes,
        paymentTerms: dto.paymentTerms,
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : undefined,
      },
      include: { items: true },
    });
  }

  private async transitionSalesOrder(
    id: string,
    organizationId: string,
    actorId: string,
    targetStatus: SalesOrderStatus,
    dto?: SalesOrderActionDto,
  ) {
    const order = await this.getSalesOrderById(id, organizationId);
    const current = order.status;
    const allowed = VALID_SO_TRANSITIONS[current] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition sales order from ${current} to ${targetStatus}`,
      );
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: targetStatus },
      include: { items: true },
    });

    await this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action: `SALES_ORDER_${targetStatus}`,
        entityType: "SalesOrder",
        entityId: id,
        metadata: { from: current, to: targetStatus, notes: dto?.notes },
      },
    });

    return updated;
  }

  confirm(
    id: string,
    orgId: string,
    actorId: string,
    dto?: SalesOrderActionDto,
  ) {
    return this.transitionSalesOrder(id, orgId, actorId, "CONFIRMED", dto);
  }
  process(
    id: string,
    orgId: string,
    actorId: string,
    dto?: SalesOrderActionDto,
  ) {
    return this.transitionSalesOrder(id, orgId, actorId, "PROCESSING", dto);
  }
  cancel(
    id: string,
    orgId: string,
    actorId: string,
    dto?: SalesOrderActionDto,
  ) {
    return this.transitionSalesOrder(id, orgId, actorId, "CANCELLED", dto);
  }
}

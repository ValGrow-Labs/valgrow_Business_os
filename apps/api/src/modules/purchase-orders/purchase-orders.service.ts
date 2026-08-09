import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import {
  UpdatePurchaseOrderDto,
  POActionDto,
} from "./dto/update-purchase-order.dto";
import { Prisma, PurchaseOrderStatus } from "@prisma/client";

const VALID_PO_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> =
  {
    DRAFT: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["APPROVED", "CANCELLED"],
    APPROVED: ["SENT", "CANCELLED"],
    SENT: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
    PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
    RECEIVED: [],
    CANCELLED: [],
  };

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async generatePONumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx || this.prisma;
    const year = new Date().getFullYear();
    const seq = await db.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "PO",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "PO", year, lastSequence: 1 },
    });
    return `PO-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async validatePOSetup(
    organizationId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, organizationId, deletedAt: null },
    });
    if (!supplier) {
      throw new BadRequestException("Supplier not found in this organization");
    }

    if (dto.purchaseRequestId) {
      const pr = await this.prisma.purchaseRequest.findFirst({
        where: { id: dto.purchaseRequestId, organizationId },
      });
      if (!pr) {
        throw new BadRequestException(
          "Purchase request not found in this organization",
        );
      }
    }

    if (dto.warehouseId) {
      const wh = await this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, organizationId, deletedAt: null },
      });
      if (!wh)
        throw new BadRequestException(
          "Warehouse not found in this organization",
        );
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, organizationId, deletedAt: null },
      });
      if (!branch)
        throw new BadRequestException("Branch not found in this organization");
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

  async getPurchaseOrders(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        purchaseRequest: { select: { id: true, requestNumber: true } },
        warehouse: { select: { id: true, name: true, code: true } },
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

  async getPurchaseOrderById(id: string, organizationId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        supplier: true,
        purchaseRequest: { select: { id: true, requestNumber: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
        goodsReceipts: {
          select: { id: true, receiptNumber: true, status: true },
        },
      },
    });
    if (!po) throw new NotFoundException("Purchase order not found");
    return po;
  }

  async createPurchaseOrder(
    organizationId: string,
    createdById: string,
    dto: CreatePurchaseOrderDto,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "Purchase order must have at least one item",
      );
    }
    await this.validatePOSetup(organizationId, dto);

    return this.prisma.$transaction(async (tx) => {
      const poNumber = await this.generatePONumber(organizationId, tx);

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
          receivedQty: new Prisma.Decimal(0),
          unitPrice: price,
          taxRate: taxRate,
          taxAmount: taxAmount,
          discountAmount: discount,
          totalAmount: lineTotal,
        };
      });

      const totalAmount = subtotal.add(taxTotal);

      return tx.purchaseOrder.create({
        data: {
          organizationId,
          orderNumber: poNumber,
          supplierId: dto.supplierId,
          purchaseRequestId: dto.purchaseRequestId || null,
          branchId: dto.branchId || null,
          warehouseId: dto.warehouseId || "",
          currency: dto.currency || "INR",
          exchangeRate: new Prisma.Decimal(dto.exchangeRate ?? 1),
          orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          paymentTerms: dto.paymentTerms,
          notes: dto.notes,
          subtotalAmount: subtotal,
          taxAmount: taxTotal,
          totalAmount,
          status: "DRAFT",
          items: { create: itemsData },
        },
        include: {
          items: true,
          supplier: { select: { id: true, name: true } },
        },
      });
    });
  }

  async updatePurchaseOrder(
    id: string,
    organizationId: string,
    dto: UpdatePurchaseOrderDto,
  ) {
    const po = await this.getPurchaseOrderById(id, organizationId);
    if (po.status !== "DRAFT") {
      throw new BadRequestException("Only DRAFT purchase orders can be edited");
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        paymentTerms: dto.paymentTerms,
        notes: dto.notes,
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : undefined,
      },
      include: { items: true },
    });
  }

  private async transitionPO(
    id: string,
    organizationId: string,
    actorId: string,
    targetStatus: PurchaseOrderStatus,
    dto?: POActionDto,
  ) {
    const po = await this.getPurchaseOrderById(id, organizationId);
    const current = po.status;
    const allowed = VALID_PO_TRANSITIONS[current] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition PO from ${current} to ${targetStatus}`,
      );
    }
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: targetStatus },
      include: { items: true },
    });
    await this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action: `PO_${targetStatus}`,
        entityType: "PurchaseOrder",
        entityId: id,
        metadata: { from: current, to: targetStatus, notes: dto?.notes },
      },
    });
    return updated;
  }

  submit(id: string, orgId: string, actorId: string, dto?: POActionDto) {
    return this.transitionPO(id, orgId, actorId, "SUBMITTED", dto);
  }
  approve(id: string, orgId: string, actorId: string, dto?: POActionDto) {
    return this.transitionPO(id, orgId, actorId, "APPROVED", dto);
  }
  send(id: string, orgId: string, actorId: string, dto?: POActionDto) {
    return this.transitionPO(id, orgId, actorId, "SENT", dto);
  }
  cancel(id: string, orgId: string, actorId: string, dto?: POActionDto) {
    return this.transitionPO(id, orgId, actorId, "CANCELLED", dto);
  }
}

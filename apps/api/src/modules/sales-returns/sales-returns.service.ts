import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSalesReturnDto } from "./dto/create-sales-return.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateSRNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "SR",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "SR", year, lastSequence: 1 },
    });
    return `SR-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  async getSalesReturns(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.salesReturn.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        salesOrder: { select: { id: true, orderNumber: true } },
        salesInvoice: { select: { id: true, invoiceNumber: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            location: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSalesReturnById(id: string, organizationId: string) {
    const sr = await this.prisma.salesReturn.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        warehouse: true,
        salesOrder: { select: { id: true, orderNumber: true } },
        salesInvoice: { select: { id: true, invoiceNumber: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            location: { select: { id: true, name: true, code: true } },
          },
        },
        creditNotes: true,
      },
    });
    if (!sr) throw new NotFoundException("Sales return not found");
    return sr;
  }

  async createSalesReturn(organizationId: string, dto: CreateSalesReturnDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "Sales return must contain at least one item",
      );
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });
    if (!customer) {
      throw new BadRequestException("Customer not found in this organization");
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });
    if (!warehouse) {
      throw new BadRequestException("Warehouse not found in this organization");
    }

    if (dto.salesOrderId) {
      const so = await this.prisma.salesOrder.findFirst({
        where: { id: dto.salesOrderId, organizationId },
      });
      if (!so)
        throw new BadRequestException(
          "Sales order not found in this organization",
        );
    }

    if (dto.salesInvoiceId) {
      const inv = await this.prisma.salesInvoice.findFirst({
        where: { id: dto.salesInvoiceId, organizationId },
      });
      if (!inv)
        throw new BadRequestException(
          "Sales invoice not found in this organization",
        );
    }

    for (const item of dto.items) {
      if (
        new Prisma.Decimal(item.returnedQty).gt(
          new Prisma.Decimal(item.originalQty),
        )
      ) {
        throw new BadRequestException(
          `Cannot return ${item.returnedQty} units for product ${item.productId}. Exceeds original sold/delivered quantity of ${item.originalQty}`,
        );
      }

      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, organizationId, deletedAt: null },
      });
      if (!product)
        throw new BadRequestException(`Product ${item.productId} not found`);

      if (item.variantId) {
        const variant = await this.prisma.productVariant.findFirst({
          where: { id: item.variantId, organizationId, deletedAt: null },
        });
        if (!variant)
          throw new BadRequestException(`Variant ${item.variantId} not found`);
      }

      const location = await this.prisma.location.findFirst({
        where: {
          id: item.locationId,
          warehouseId: dto.warehouseId,
          organizationId,
          deletedAt: null,
        },
      });
      if (!location) {
        throw new BadRequestException(
          `Location ${item.locationId} does not belong to warehouse ${dto.warehouseId}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const returnNumber = await this.generateSRNumber(organizationId, tx);

      let totalRefund = new Prisma.Decimal(0);
      const itemsData = dto.items.map((i) => {
        const refAmount = new Prisma.Decimal(i.refundAmount);
        totalRefund = totalRefund.add(refAmount);
        return {
          organizationId,
          productId: i.productId,
          variantId: i.variantId || null,
          locationId: i.locationId,
          originalQty: new Prisma.Decimal(i.originalQty),
          returnedQty: new Prisma.Decimal(i.returnedQty),
          reason: i.reason || "OTHER",
          condition: i.condition,
          refundAmount: refAmount,
        };
      });

      return tx.salesReturn.create({
        data: {
          organizationId,
          returnNumber,
          customerId: dto.customerId,
          salesOrderId: dto.salesOrderId || null,
          salesInvoiceId: dto.salesInvoiceId || null,
          warehouseId: dto.warehouseId,
          returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
          totalRefundAmount: totalRefund,
          notes: dto.notes,
          status: "DRAFT",
          items: { create: itemsData },
        },
        include: { items: true },
      });
    });
  }

  async postSalesReturn(id: string, organizationId: string, actorId: string) {
    const sr = await this.getSalesReturnById(id, organizationId);
    if (sr.status !== "DRAFT") {
      throw new BadRequestException(
        `Sales return is already ${sr.status} and cannot be posted`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of sr.items) {
        const qty = item.returnedQty;
        if (qty.gt(item.originalQty)) {
          throw new BadRequestException(
            `Cannot return quantity ${qty} exceeding original quantity ${item.originalQty}`,
          );
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        const unitCost = product ? product.costPrice : new Prisma.Decimal(0);

        // 1. Create StockMovement (SALE_RETURN / CUSTOMER_RETURN)
        await tx.stockMovement.create({
          data: {
            organizationId,
            warehouseId: sr.warehouseId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
            movementType: "CUSTOMER_RETURN",
            quantity: qty,
            unitCost,
            totalCost: qty.mul(unitCost),
            referenceType: "SALES_RETURN",
            referenceId: sr.id,
            actorId,
            notes: `Sales Return: ${sr.returnNumber}`,
          },
        });

        // 2. Increase StockLevel onHand
        const stockLevel = await tx.stockLevel.findFirst({
          where: {
            organizationId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });

        if (stockLevel) {
          await tx.stockLevel.update({
            where: { id: stockLevel.id },
            data: {
              onHand: stockLevel.onHand.add(qty),
              version: { increment: 1 },
            },
          });
        } else {
          await tx.stockLevel.create({
            data: {
              organizationId,
              warehouseId: sr.warehouseId,
              locationId: item.locationId,
              productId: item.productId,
              variantId: item.variantId || null,
              onHand: qty,
              reserved: new Prisma.Decimal(0),
            },
          });
        }

        // 3. Create InventoryCostLayer for returned stock
        await tx.inventoryCostLayer.create({
          data: {
            organizationId,
            warehouseId: sr.warehouseId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
            initialQty: qty,
            remainingQty: qty,
            baseUnitCost: unitCost,
            landedCostPerUnit: new Prisma.Decimal(0),
            unitCost,
            status: "ACTIVE",
          },
        });
      }

      const postedSr = await tx.salesReturn.update({
        where: { id },
        data: { status: "POSTED" },
        include: { items: true },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "SALES_RETURN_POSTED",
          entityType: "SalesReturn",
          entityId: id,
          metadata: {
            returnNumber: sr.returnNumber,
            itemCount: sr.items.length,
          },
        },
      });

      return postedSr;
    });
  }

  async cancelSalesReturn(id: string, organizationId: string, actorId: string) {
    const sr = await this.getSalesReturnById(id, organizationId);
    if (sr.status !== "DRAFT") {
      throw new BadRequestException(
        "Only DRAFT sales returns can be cancelled",
      );
    }
    const cancelled = await this.prisma.salesReturn.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action: "SALES_RETURN_CANCELLED",
        entityType: "SalesReturn",
        entityId: id,
      },
    });
    return cancelled;
  }
}

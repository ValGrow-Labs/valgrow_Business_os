import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDeliveryNoteDto } from "./dto/create-delivery-note.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class DeliveryNotesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateDNNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "DN",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "DN", year, lastSequence: 1 },
    });
    return `DN-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  async getDeliveryNotes(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.deliveryNote.findMany({
      where,
      include: {
        salesOrder: { select: { id: true, orderNumber: true } },
        customer: { select: { id: true, name: true, customerCode: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        deliveredBy: { select: { id: true, firstName: true, lastName: true } },
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

  async getDeliveryNoteById(id: string, organizationId: string) {
    const dn = await this.prisma.deliveryNote.findFirst({
      where: { id, organizationId },
      include: {
        salesOrder: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
                variant: { select: { id: true, name: true, sku: true } },
              },
            },
          },
        },
        customer: true,
        warehouse: true,
        deliveredBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            location: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    if (!dn) throw new NotFoundException("Delivery note not found");
    return dn;
  }

  async createDeliveryNote(organizationId: string, dto: CreateDeliveryNoteDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "Delivery note must have at least one item",
      );
    }

    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { id: dto.salesOrderId, organizationId },
      include: { items: true },
    });
    if (!salesOrder) {
      throw new BadRequestException(
        "Sales order not found in this organization",
      );
    }

    if (salesOrder.customerId !== dto.customerId) {
      throw new BadRequestException("Customer does not match the sales order");
    }

    if (["CANCELLED", "DELIVERED"].includes(salesOrder.status)) {
      throw new BadRequestException(
        `Cannot deliver against a ${salesOrder.status} sales order`,
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

    for (const item of dto.items) {
      const soItem = salesOrder.items.find(
        (i) => i.id === item.salesOrderItemId,
      );
      if (!soItem) {
        throw new BadRequestException(
          `Sales order item ${item.salesOrderItemId} not found on this sales order`,
        );
      }
      if (soItem.productId !== item.productId) {
        throw new BadRequestException(
          `Product mismatch on sales order item ${item.salesOrderItemId}`,
        );
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

      const remaining = soItem.orderedQty.sub(soItem.deliveredQty);
      if (new Prisma.Decimal(item.quantity).gt(remaining)) {
        throw new BadRequestException(
          `Cannot deliver ${item.quantity} for item ${item.salesOrderItemId}. ` +
            `Only ${remaining} remaining (ordered: ${soItem.orderedQty}, delivered: ${soItem.deliveredQty})`,
        );
      }

      // Check available stock at location
      const stockLevel = await this.prisma.stockLevel.findFirst({
        where: {
          organizationId,
          locationId: item.locationId,
          productId: item.productId,
          variantId: item.variantId || null,
        },
      });
      const availableQty = stockLevel
        ? stockLevel.onHand.sub(stockLevel.reserved)
        : new Prisma.Decimal(0);

      if (new Prisma.Decimal(item.quantity).gt(availableQty)) {
        throw new BadRequestException(
          `Insufficient available stock for product ${item.productId} at location ${item.locationId}. Requested: ${item.quantity}, Available: ${availableQty}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const dnNumber = await this.generateDNNumber(organizationId, tx);

      return tx.deliveryNote.create({
        data: {
          organizationId,
          deliveryNumber: dnNumber,
          salesOrderId: dto.salesOrderId,
          customerId: dto.customerId,
          warehouseId: dto.warehouseId,
          deliveredById: dto.deliveredById || null,
          deliveryDate: dto.deliveryDate
            ? new Date(dto.deliveryDate)
            : new Date(),
          referenceNumber: dto.referenceNumber,
          notes: dto.notes,
          status: "DRAFT",
          items: {
            create: dto.items.map((i) => ({
              organizationId,
              salesOrderItemId: i.salesOrderItemId,
              productId: i.productId,
              variantId: i.variantId || null,
              locationId: i.locationId,
              quantity: new Prisma.Decimal(i.quantity),
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  async postDeliveryNote(id: string, organizationId: string, actorId: string) {
    const dn = await this.getDeliveryNoteById(id, organizationId);
    if (dn.status !== "DRAFT") {
      throw new BadRequestException(
        `Delivery note is already ${dn.status} and cannot be posted`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Re-validate quantities & stock in transaction for concurrency safety
      for (const item of dn.items) {
        const qty = item.quantity;

        const soItem = await tx.salesOrderItem.findFirst({
          where: { id: item.salesOrderItemId },
        });
        if (!soItem) {
          throw new BadRequestException(
            `Sales order item ${item.salesOrderItemId} not found`,
          );
        }

        const remaining = soItem.orderedQty.sub(soItem.deliveredQty);
        if (qty.gt(remaining)) {
          throw new BadRequestException(
            `Cannot deliver ${qty} for item ${item.salesOrderItemId}. Only ${remaining} remaining`,
          );
        }

        const stockLevel = await tx.stockLevel.findFirst({
          where: {
            organizationId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });

        const available = stockLevel
          ? stockLevel.onHand.sub(stockLevel.reserved)
          : new Prisma.Decimal(0);

        if (qty.gt(available)) {
          throw new BadRequestException(
            `Insufficient available stock for product ${item.productId} at location ${item.locationId}. Requested: ${qty}, Available: ${available}`,
          );
        }

        // Determine unit cost from cost layer or product costPrice
        const activeCostLayer = await tx.inventoryCostLayer.findFirst({
          where: {
            organizationId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
            status: "ACTIVE",
          },
          orderBy: { createdAt: "asc" },
        });

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const unitCost = activeCostLayer
          ? activeCostLayer.unitCost
          : product
            ? product.costPrice
            : new Prisma.Decimal(0);

        // 1. Create StockMovement (SALE_SHIPMENT)
        await tx.stockMovement.create({
          data: {
            organizationId,
            warehouseId: dn.warehouseId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
            movementType: "SALE_SHIPMENT",
            quantity: qty.negated(),
            unitCost,
            totalCost: qty.mul(unitCost),
            referenceType: "DELIVERY_NOTE",
            referenceId: dn.id,
            actorId,
            notes: `Delivery Note: ${dn.deliveryNumber}`,
          },
        });

        // 2. Decrease StockLevel onHand
        await tx.stockLevel.update({
          where: { id: stockLevel!.id },
          data: {
            onHand: stockLevel!.onHand.sub(qty),
            version: { increment: 1 },
          },
        });

        // 3. Consume InventoryCostLayers (FIFO)
        let qtyToDeduct = qty;
        const costLayers = await tx.inventoryCostLayer.findMany({
          where: {
            organizationId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
            status: "ACTIVE",
          },
          orderBy: { createdAt: "asc" },
        });

        for (const layer of costLayers) {
          if (qtyToDeduct.isZero()) break;
          if (layer.remainingQty.lte(qtyToDeduct)) {
            qtyToDeduct = qtyToDeduct.sub(layer.remainingQty);
            await tx.inventoryCostLayer.update({
              where: { id: layer.id },
              data: {
                remainingQty: new Prisma.Decimal(0),
                status: "EXHAUSTED",
              },
            });
          } else {
            await tx.inventoryCostLayer.update({
              where: { id: layer.id },
              data: {
                remainingQty: layer.remainingQty.sub(qtyToDeduct),
              },
            });
            qtyToDeduct = new Prisma.Decimal(0);
          }
        }

        // 4. Update SalesOrderItem.deliveredQty
        await tx.salesOrderItem.update({
          where: { id: soItem.id },
          data: { deliveredQty: soItem.deliveredQty.add(qty) },
        });
      }

      // Mark DeliveryNote POSTED
      const postedDn = await tx.deliveryNote.update({
        where: { id },
        data: { status: "POSTED" },
        include: { items: true },
      });

      // Update SalesOrder status
      const updatedSO = await tx.salesOrder.findUnique({
        where: { id: dn.salesOrderId },
        include: { items: true },
      });

      if (updatedSO) {
        const allDelivered = updatedSO.items.every((i) =>
          i.deliveredQty.gte(i.orderedQty),
        );
        const anyDelivered = updatedSO.items.some((i) => i.deliveredQty.gt(0));

        let newSOStatus = updatedSO.status;
        if (allDelivered) {
          newSOStatus = "DELIVERED";
        } else if (anyDelivered) {
          newSOStatus = "PARTIALLY_DELIVERED";
        }

        if (newSOStatus !== updatedSO.status) {
          await tx.salesOrder.update({
            where: { id: dn.salesOrderId },
            data: { status: newSOStatus },
          });
        }
      }

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "DELIVERY_POSTED",
          entityType: "DeliveryNote",
          entityId: id,
          metadata: {
            deliveryNumber: dn.deliveryNumber,
            itemCount: dn.items.length,
          },
        },
      });

      return postedDn;
    });
  }

  async cancelDeliveryNote(
    id: string,
    organizationId: string,
    actorId: string,
  ) {
    const dn = await this.getDeliveryNoteById(id, organizationId);
    if (dn.status !== "DRAFT") {
      throw new BadRequestException(
        "Only DRAFT delivery notes can be cancelled",
      );
    }
    const cancelled = await this.prisma.deliveryNote.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action: "DELIVERY_CANCELLED",
        entityType: "DeliveryNote",
        entityId: id,
      },
    });
    return cancelled;
  }
}

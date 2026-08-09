import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateGoodsReceiptDto } from "./dto/create-goods-receipt.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class GoodsReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateGRNNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "GRN",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "GRN", year, lastSequence: 1 },
    });
    return `GRN-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  async getGoodsReceipts(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.goodsReceipt.findMany({
      where,
      include: {
        purchaseOrder: { select: { id: true, orderNumber: true } },
        supplier: { select: { id: true, name: true, code: true } },
        warehouse: { select: { id: true, name: true, code: true } },
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

  async getGoodsReceiptById(id: string, organizationId: string) {
    const grn = await this.prisma.goodsReceipt.findFirst({
      where: { id, organizationId },
      include: {
        purchaseOrder: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
                variant: { select: { id: true, name: true, sku: true } },
              },
            },
          },
        },
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            location: { select: { id: true, name: true, code: true } },
          },
        },
        landedCostAllocations: true,
      },
    });
    if (!grn) throw new NotFoundException("Goods receipt not found");
    return grn;
  }

  async createGoodsReceipt(
    organizationId: string,
    receivedById: string,
    dto: CreateGoodsReceiptDto,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "Goods receipt must have at least one item",
      );
    }

    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, organizationId },
      include: { items: true },
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

    if (["CANCELLED", "RECEIVED"].includes(po.status)) {
      throw new BadRequestException(
        `Cannot receive against a ${po.status} purchase order`,
      );
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, organizationId, deletedAt: null },
    });
    if (!supplier)
      throw new BadRequestException("Supplier not found in this organization");

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });
    if (!warehouse)
      throw new BadRequestException("Warehouse not found in this organization");

    for (const item of dto.items) {
      const poItem = po.items.find((i) => i.id === item.purchaseOrderItemId);
      if (!poItem) {
        throw new BadRequestException(
          `Purchase order item ${item.purchaseOrderItemId} not found on this PO`,
        );
      }
      if (poItem.productId !== item.productId) {
        throw new BadRequestException(
          `Product mismatch on PO item ${item.purchaseOrderItemId}`,
        );
      }

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

      const alreadyReceived = poItem.receivedQty;
      const ordered = poItem.orderedQty;
      const remaining = ordered.sub(alreadyReceived);
      if (new Prisma.Decimal(item.receivedQty).gt(remaining)) {
        throw new BadRequestException(
          `Cannot receive ${item.receivedQty} for item ${item.purchaseOrderItemId}. ` +
            `Only ${remaining} remaining (ordered: ${ordered}, received: ${alreadyReceived})`,
        );
      }

      if (item.serialNumbers && item.serialNumbers.length > 0) {
        const uniqueSerials = new Set(item.serialNumbers);
        if (uniqueSerials.size !== item.serialNumbers.length) {
          throw new BadRequestException(
            "Duplicate serial numbers in the same receipt are not allowed",
          );
        }
        for (const serial of item.serialNumbers) {
          const existing = await this.prisma.inventorySerialNumber.findFirst({
            where: { organizationId, serialNumber: serial },
          });
          if (existing) {
            throw new BadRequestException(
              `Serial number '${serial}' already exists in this organization`,
            );
          }
        }
        if (item.serialNumbers.length !== item.receivedQty) {
          throw new BadRequestException(
            `Number of serial numbers (${item.serialNumbers.length}) must match received quantity (${item.receivedQty})`,
          );
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const grnNumber = await this.generateGRNNumber(organizationId, tx);

      const grn = await tx.goodsReceipt.create({
        data: {
          organizationId,
          receiptNumber: grnNumber,
          purchaseOrderId: dto.purchaseOrderId,
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          receivedById,
          receivedAt: dto.receivedDate
            ? new Date(dto.receivedDate)
            : new Date(),
          notes: dto.notes,
          status: "DRAFT",
          items: {
            create: dto.items.map((i) => {
              const receivedQty = new Prisma.Decimal(i.receivedQty);
              const unitCost = new Prisma.Decimal(i.unitCost);
              return {
                organizationId,
                purchaseOrderItemId: i.purchaseOrderItemId,
                productId: i.productId,
                variantId: i.variantId || null,
                locationId: i.locationId,
                batchNumber: i.batchNumber,
                manufactureDate: i.manufactureDate
                  ? new Date(i.manufactureDate)
                  : null,
                expiryDate: i.expiryDate ? new Date(i.expiryDate) : null,
                receivedQty,
                rejectedQty: new Prisma.Decimal(i.rejectedQty ?? 0),
                unitCost,
                totalCost: receivedQty.mul(unitCost),
              };
            }),
          },
        },
        include: { items: true },
      });

      return grn;
    });
  }

  async postGoodsReceipt(id: string, organizationId: string, actorId: string) {
    const grn = await this.getGoodsReceiptById(id, organizationId);
    if (grn.status !== "DRAFT") {
      throw new BadRequestException(
        `GRN is already ${grn.status} and cannot be posted`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of grn.items) {
        const qty = item.receivedQty;
        const unitCost = item.unitCost;
        const totalCost = qty.mul(unitCost);

        const movement = await tx.stockMovement.create({
          data: {
            organizationId,
            warehouseId: grn.warehouseId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
            movementType: "PURCHASE_RECEIPT",
            quantity: qty,
            unitCost,
            totalCost,
            referenceType: "GOODS_RECEIPT",
            referenceId: grn.id,
            actorId,
            notes: `GRN: ${grn.receiptNumber}`,
          },
        });

        const existingStock = await tx.stockLevel.findFirst({
          where: {
            organizationId,
            warehouseId: grn.warehouseId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });

        if (existingStock) {
          await tx.stockLevel.update({
            where: { id: existingStock.id },
            data: {
              onHand: existingStock.onHand.add(qty),
              version: { increment: 1 },
            },
          });
        } else {
          await tx.stockLevel.create({
            data: {
              organizationId,
              warehouseId: grn.warehouseId,
              locationId: item.locationId,
              productId: item.productId,
              variantId: item.variantId || null,
              onHand: qty,
              reserved: new Prisma.Decimal(0),
            },
          });
        }

        await tx.inventoryCostLayer.create({
          data: {
            organizationId,
            warehouseId: grn.warehouseId,
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

        if (item.batchNumber) {
          await tx.inventoryBatch.create({
            data: {
              organizationId,
              productId: item.productId,
              variantId: item.variantId || null,
              batchNumber: item.batchNumber,
              manufactureDate: item.manufactureDate,
              expiryDate: item.expiryDate,
              costPrice: unitCost,
            },
          });
        }

        const poItem = await tx.purchaseOrderItem.findFirst({
          where: { id: item.purchaseOrderItemId },
        });
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: poItem.receivedQty.add(qty) },
          });
        }
      }

      const postedGrn = await tx.goodsReceipt.update({
        where: { id },
        data: { status: "POSTED" },
        include: { items: true },
      });

      const updatedPO = await tx.purchaseOrder.findUnique({
        where: { id: grn.purchaseOrderId },
        include: { items: true },
      });

      if (updatedPO) {
        const allFulfilled = updatedPO.items.every((i) =>
          i.receivedQty.gte(i.orderedQty),
        );
        const anyReceived = updatedPO.items.some((i) => i.receivedQty.gt(0));

        let newPOStatus = updatedPO.status;
        if (allFulfilled) {
          newPOStatus = "RECEIVED";
        } else if (anyReceived) {
          newPOStatus = "PARTIALLY_RECEIVED";
        }

        if (newPOStatus !== updatedPO.status) {
          await tx.purchaseOrder.update({
            where: { id: grn.purchaseOrderId },
            data: { status: newPOStatus },
          });
        }
      }

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "GRN_POSTED",
          entityType: "GoodsReceipt",
          entityId: id,
          metadata: {
            receiptNumber: grn.receiptNumber,
            itemCount: grn.items.length,
          },
        },
      });

      return postedGrn;
    });
  }

  async cancelGoodsReceipt(
    id: string,
    organizationId: string,
    actorId: string,
  ) {
    const grn = await this.getGoodsReceiptById(id, organizationId);
    if (grn.status !== "DRAFT") {
      throw new BadRequestException(
        "Only DRAFT goods receipts can be cancelled",
      );
    }
    const cancelled = await this.prisma.goodsReceipt.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action: "GRN_CANCELLED",
        entityType: "GoodsReceipt",
        entityId: id,
      },
    });
    return cancelled;
  }
}

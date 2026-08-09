import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class InventoryAdjustmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateAdjustmentSetup(
    organizationId: string,
    dto: CreateAdjustmentDto,
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });
    if (!warehouse) {
      throw new BadRequestException(
        "Warehouse does not exist in this organization",
      );
    }

    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, organizationId, deletedAt: null },
      });
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} does not exist in this organization`,
        );
      }

      if (item.variantId) {
        const variant = await this.prisma.productVariant.findFirst({
          where: { id: item.variantId, organizationId, deletedAt: null },
        });
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.variantId} does not exist in this organization`,
          );
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
    }
  }

  async getAdjustments(organizationId: string) {
    return this.prisma.stockAdjustment.findMany({
      where: { organizationId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAdjustmentById(id: string, organizationId: string) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id, organizationId },
      include: {
        items: true,
      },
    });

    if (!adjustment) {
      throw new NotFoundException(
        "Stock adjustment record not found in this organization",
      );
    }

    return adjustment;
  }

  async createAdjustment(
    organizationId: string,
    createdById: string,
    dto: CreateAdjustmentDto,
  ) {
    await this.validateAdjustmentSetup(organizationId, dto);

    const existingNum = await this.prisma.stockAdjustment.findFirst({
      where: { organizationId, adjustmentNumber: dto.adjustmentNumber },
    });
    if (existingNum) {
      throw new BadRequestException(
        `Adjustment number '${dto.adjustmentNumber}' is already in use`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          organizationId,
          adjustmentNumber: dto.adjustmentNumber,
          warehouseId: dto.warehouseId,
          reason: dto.reason,
          notes: dto.notes,
          createdById,
          items: {
            create: dto.items.map((i) => ({
              locationId: i.locationId,
              productId: i.productId,
              variantId: i.variantId || null,
              batchId: i.batchId || null,
              currentQty: new Prisma.Decimal(i.currentQty),
              adjustedQty: new Prisma.Decimal(i.adjustedQty),
              newQty: new Prisma.Decimal(i.newQty),
              unitCost: new Prisma.Decimal(i.unitCost),
            })),
          },
        },
        include: { items: true },
      });

      for (const item of dto.items) {
        const diffDecimal = new Prisma.Decimal(item.adjustedQty);
        const costDecimal = new Prisma.Decimal(item.unitCost);

        if (diffDecimal.isZero()) continue;

        const movementType = diffDecimal.isPositive()
          ? "ADJUSTMENT_IN"
          : "ADJUSTMENT_OUT";

        // Upsert StockLevel
        const stockLevel = await tx.stockLevel.findFirst({
          where: {
            organizationId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
            batchId: item.batchId || null,
          },
        });

        const currentOnHand = stockLevel
          ? stockLevel.onHand
          : new Prisma.Decimal(0);
        const newOnHand = currentOnHand.add(diffDecimal);

        if (stockLevel) {
          await tx.stockLevel.update({
            where: { id: stockLevel.id },
            data: { onHand: newOnHand, version: { increment: 1 } },
          });
        } else {
          await tx.stockLevel.create({
            data: {
              organizationId,
              warehouseId: dto.warehouseId,
              locationId: item.locationId,
              productId: item.productId,
              variantId: item.variantId || null,
              batchId: item.batchId || null,
              onHand: newOnHand,
              reserved: new Prisma.Decimal(0),
            },
          });
        }

        // Post immutable Movement
        await tx.stockMovement.create({
          data: {
            organizationId,
            warehouseId: dto.warehouseId,
            locationId: item.locationId,
            productId: item.productId,
            variantId: item.variantId || null,
            batchId: item.batchId || null,
            movementType,
            quantity: diffDecimal,
            unitCost: costDecimal,
            totalCost: diffDecimal.mul(costDecimal),
            referenceType: "STOCK_ADJUSTMENT",
            referenceId: adjustment.id,
            actorId: createdById,
            notes: `Adjustment: ${dto.reason}`,
          },
        });

        // Add Cost Layer if ADJUSTMENT_IN
        if (diffDecimal.isPositive()) {
          await tx.inventoryCostLayer.create({
            data: {
              organizationId,
              warehouseId: dto.warehouseId,
              locationId: item.locationId,
              productId: item.productId,
              variantId: item.variantId || null,
              batchId: item.batchId || null,
              initialQty: diffDecimal,
              remainingQty: diffDecimal,
              unitCost: costDecimal,
              status: "ACTIVE",
            },
          });
        }
      }

      return adjustment;
    });
  }
}

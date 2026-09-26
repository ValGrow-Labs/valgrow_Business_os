import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMovementDto } from "./dto/create-movement.dto";
import { Prisma } from "@prisma/client";

export interface MovementQueryOptions {
  locationId?: string;
  productId?: string;
  variantId?: string;
  movementType?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class InventoryMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateReferences(
    organizationId: string,
    dto: CreateMovementDto,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, organizationId, deletedAt: null },
    });
    if (!product) {
      throw new BadRequestException(
        "Product does not exist in this organization",
      );
    }

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: dto.variantId, organizationId, deletedAt: null },
      });
      if (!variant) {
        throw new BadRequestException(
          "Variant does not exist in this organization",
        );
      }
      if (variant.productId !== dto.productId) {
        throw new BadRequestException(
          "Variant does not belong to the specified product",
        );
      }
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });
    if (!warehouse) {
      throw new BadRequestException(
        "Warehouse does not exist in this organization",
      );
    }

    const location = await this.prisma.location.findFirst({
      where: {
        id: dto.locationId,
        organizationId,
        warehouseId: dto.warehouseId,
        deletedAt: null,
      },
    });
    if (!location) {
      throw new BadRequestException(
        "Location does not exist or does not belong to the specified warehouse",
      );
    }

    if (dto.batchId) {
      const batch = await this.prisma.inventoryBatch.findFirst({
        where: { id: dto.batchId, organizationId },
      });
      if (!batch) {
        throw new BadRequestException(
          "Batch does not exist in this organization",
        );
      }
    }

    if (dto.serialNumberId) {
      const serial = await this.prisma.inventorySerialNumber.findFirst({
        where: { id: dto.serialNumberId, organizationId },
      });
      if (!serial) {
        throw new BadRequestException(
          "Serial number does not exist in this organization",
        );
      }
    }
  }

  async getMovements(
    organizationId: string,
    options: MovementQueryOptions = {},
  ) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options.locationId) where.locationId = options.locationId;
    if (options.productId) where.productId = options.productId;
    if (options.variantId) where.variantId = options.variantId;
    if (options.movementType) where.movementType = options.movementType;

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMovementById(id: string, organizationId: string) {
    const movement = await this.prisma.stockMovement.findFirst({
      where: { id, organizationId },
    });

    if (!movement) {
      throw new NotFoundException(
        "Stock movement record not found in this organization",
      );
    }

    return movement;
  }

  async createMovement(
    organizationId: string,
    actorId: string,
    dto: CreateMovementDto,
  ) {
    await this.validateReferences(organizationId, dto);

    const qtyDecimal = new Prisma.Decimal(dto.quantity);
    const costDecimal = new Prisma.Decimal(dto.unitCost);
    const totalCostDecimal = qtyDecimal.mul(costDecimal);

    return this.prisma.$transaction(async (tx) => {
      // 1. Check existing StockLevel
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          organizationId,
          locationId: dto.locationId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          batchId: dto.batchId || null,
        },
      });

      const currentOnHand = stockLevel
        ? stockLevel.onHand
        : new Prisma.Decimal(0);
      const currentReserved = stockLevel
        ? stockLevel.reserved
        : new Prisma.Decimal(0);
      const currentAvailable = currentOnHand.sub(currentReserved);

      // 2. Reject negative stock if available stock is insufficient for outbound movements
      if (qtyDecimal.isNegative()) {
        const requiredQty = qtyDecimal.abs();
        if (currentAvailable.lt(requiredQty)) {
          throw new BadRequestException(
            `Insufficient available stock (${currentAvailable}) for requested deduction (${requiredQty})`,
          );
        }
      }

      // 3. Create immutable StockMovement
      const movement = await tx.stockMovement.create({
        data: {
          organizationId,
          branchId: dto.branchId || null,
          warehouseId: dto.warehouseId,
          locationId: dto.locationId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          batchId: dto.batchId || null,
          serialNumberId: dto.serialNumberId || null,
          serialNumber: dto.serialNumber || null,
          movementType: dto.movementType,
          quantity: qtyDecimal,
          unitCost: costDecimal,
          totalCost: totalCostDecimal,
          referenceType: dto.referenceType || null,
          referenceId: dto.referenceId || null,
          actorId,
          notes: dto.notes || null,
        },
      });

      // 4. Upsert StockLevel snapshot
      const newOnHand = currentOnHand.add(qtyDecimal);
      if (stockLevel) {
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            onHand: newOnHand,
            version: { increment: 1 },
          },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            organizationId,
            warehouseId: dto.warehouseId,
            locationId: dto.locationId,
            productId: dto.productId,
            variantId: dto.variantId || null,
            batchId: dto.batchId || null,
            onHand: newOnHand,
            reserved: new Prisma.Decimal(0),
          },
        });
      }

      // 5. Create InventoryCostLayer if inbound receipt
      if (qtyDecimal.isPositive()) {
        await tx.inventoryCostLayer.create({
          data: {
            organizationId,
            warehouseId: dto.warehouseId,
            locationId: dto.locationId,
            productId: dto.productId,
            variantId: dto.variantId || null,
            batchId: dto.batchId || null,
            initialQty: qtyDecimal,
            remainingQty: qtyDecimal,
            unitCost: costDecimal,
            status: "ACTIVE",
          },
        });
      }

      return movement;
    });
  }
}

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
  warehouseId?: string;
  productId?: string;
  variantId?: string;
  movementType?: string;
  search?: string;
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
    if (options.locationId && options.locationId !== "ALL") where.locationId = options.locationId;
    if (options.warehouseId && options.warehouseId !== "ALL") where.warehouseId = options.warehouseId;
    if (options.productId) where.productId = options.productId;
    if (options.variantId) where.variantId = options.variantId;
    if (options.movementType && options.movementType !== "ALL") where.movementType = options.movementType;

    if (options.search) {
      const term = options.search.trim();
      where.OR = [
        { product: { name: { contains: term, mode: "insensitive" } } },
        { product: { sku: { contains: term, mode: "insensitive" } } },
        { referenceId: { contains: term, mode: "insensitive" } },
        { serialNumber: { contains: term, mode: "insensitive" } },
        { notes: { contains: term, mode: "insensitive" } },
        { actor: { firstName: { contains: term, mode: "insensitive" } } },
        { actor: { lastName: { contains: term, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
          batch: { select: { id: true, batchNumber: true, batchType: true } },
          serial: { select: { id: true, serialNumber: true } },
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
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
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, batchNumber: true, batchType: true } },
        serial: { select: { id: true, serialNumber: true } },
        actor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
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
    const totalCostDecimal = qtyDecimal.mul(costDecimal).abs();
    const isOutbound = qtyDecimal.isNegative();

    // ── Pre-transaction guard for outbound movements ─────────────────────────
    // We read available stock BEFORE entering the transaction to give a fast
    // early rejection. The final check inside the transaction is authoritative.
    if (isOutbound) {
      const snapshot = await this.prisma.stockLevel.findFirst({
        where: {
          organizationId,
          locationId: dto.locationId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          batchId: dto.batchId || null,
        },
        select: { onHand: true, reserved: true },
      });
      const available = snapshot
        ? snapshot.onHand.sub(snapshot.reserved)
        : new Prisma.Decimal(0);
      if (available.lt(qtyDecimal.abs())) {
        throw new BadRequestException(
          `Insufficient available stock (${available}) for requested deduction (${qtyDecimal.abs()})`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // ── 1. Find or prepare StockLevel row ──────────────────────────────────
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          organizationId,
          locationId: dto.locationId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          batchId: dto.batchId || null,
        },
      });

      // ── 2. Final authoritative stock check inside transaction ─────────────
      if (isOutbound && stockLevel) {
        const available = stockLevel.onHand.sub(stockLevel.reserved);
        if (available.lt(qtyDecimal.abs())) {
          throw new BadRequestException(
            `Insufficient available stock (${available}) for requested deduction (${qtyDecimal.abs()})`,
          );
        }
      } else if (isOutbound && !stockLevel) {
        throw new BadRequestException(
          "No stock exists at this location for the specified product",
        );
      }

      // ── 3. Create immutable StockMovement ledger row ──────────────────────
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

      // ── 4. Atomic StockLevel upsert ───────────────────────────────────────
      // Using { increment } ensures NO read-modify-write race condition.
      // Two concurrent transactions increment atomically — safe at DB level.
      if (stockLevel) {
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            onHand: { increment: qtyDecimal.toNumber() },
            version: { increment: 1 },
          },
        });
      } else {
        // First movement for this product-location: create a new StockLevel row
        await tx.stockLevel.create({
          data: {
            organizationId,
            warehouseId: dto.warehouseId,
            locationId: dto.locationId,
            productId: dto.productId,
            variantId: dto.variantId || null,
            batchId: dto.batchId || null,
            onHand: qtyDecimal,
            reserved: new Prisma.Decimal(0),
          },
        });
      }

      // ── 5. Add InventoryCostLayer only for true inbound quantities ────────
      if (!isOutbound) {
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

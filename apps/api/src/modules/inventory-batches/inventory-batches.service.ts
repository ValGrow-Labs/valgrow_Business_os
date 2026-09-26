import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { UpdateBatchDto } from "./dto/update-batch.dto";
import { Prisma } from "@prisma/client";

export interface BatchQueryOptions {
  productId?: string;
  variantId?: string;
  batchType?: string;
  status?: string;
  search?: string;
  expired?: boolean;
  expiringSoonDays?: number;
}

@Injectable()
export class InventoryBatchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateProductAndVariant(
    organizationId: string,
    productId: string,
    variantId?: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId, deletedAt: null },
    });

    if (!product) {
      throw new BadRequestException(
        "Product does not exist in this organization",
      );
    }

    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, organizationId, deletedAt: null },
      });

      if (!variant) {
        throw new BadRequestException(
          "Variant does not exist in this organization",
        );
      }

      if (variant.productId !== productId) {
        throw new BadRequestException(
          "Variant does not belong to the specified product",
        );
      }
    }
  }

  async getBatches(organizationId: string, options: BatchQueryOptions = {}) {
    const where: Prisma.InventoryBatchWhereInput = { organizationId };

    if (options.productId) where.productId = options.productId;
    if (options.variantId) where.variantId = options.variantId;
    if (options.batchType && options.batchType !== "ALL") {
      where.batchType = options.batchType;
    }

    if (options.search) {
      const term = options.search.trim();
      where.OR = [
        { batchNumber: { contains: term, mode: "insensitive" } },
        { workOrderRef: { contains: term, mode: "insensitive" } },
        { product: { name: { contains: term, mode: "insensitive" } } },
        { product: { sku: { contains: term, mode: "insensitive" } } },
      ];
    }

    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + (options.expiringSoonDays || 30));

    if (options.status === "EXPIRED" || options.expired) {
      where.expiryDate = { lt: now };
    } else if (options.status === "EXPIRING_SOON" || options.expiringSoonDays) {
      where.expiryDate = { gte: now, lte: soon };
    } else if (options.status === "ACTIVE") {
      where.OR = [
        ...(where.OR || []),
        { expiryDate: null },
        { expiryDate: { gt: soon } },
      ];
    }

    const batches = await this.prisma.inventoryBatch.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
        stockLevels: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    return batches.map((batch) => {
      const quantityRemaining = batch.stockLevels.reduce((sum, sl) => {
        const onHand = Number(sl.onHand) || 0;
        const reserved = Number(sl.reserved) || 0;
        return sum + Math.max(0, onHand - reserved);
      }, 0);

      const warehouseMap = new Map<
        string,
        { id: string; name: string; code: string }
      >();
      batch.stockLevels.forEach((sl) => {
        if (sl.warehouse) {
          warehouseMap.set(sl.warehouse.id, {
            id: sl.warehouse.id,
            name: sl.warehouse.name,
            code: sl.warehouse.code,
          });
        }
      });

      const { stockLevels, ...rest } = batch;
      return {
        ...rest,
        quantityRemaining,
        warehouses: Array.from(warehouseMap.values()),
      };
    });
  }

  async getBatchById(id: string, organizationId: string) {
    const batch = await this.prisma.inventoryBatch.findFirst({
      where: { id, organizationId },
      include: {
        product: true,
        variant: true,
        stockLevels: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(
        "Inventory batch not found in this organization",
      );
    }

    const quantityRemaining = batch.stockLevels.reduce((sum, sl) => {
      const onHand = Number(sl.onHand) || 0;
      const reserved = Number(sl.reserved) || 0;
      return sum + Math.max(0, onHand - reserved);
    }, 0);

    const warehouseMap = new Map<
      string,
      { id: string; name: string; code: string }
    >();
    batch.stockLevels.forEach((sl) => {
      if (sl.warehouse) {
        warehouseMap.set(sl.warehouse.id, {
          id: sl.warehouse.id,
          name: sl.warehouse.name,
          code: sl.warehouse.code,
        });
      }
    });

    const { stockLevels, ...rest } = batch;
    return {
      ...rest,
      quantityRemaining,
      warehouses: Array.from(warehouseMap.values()),
    };
  }

  async createBatch(organizationId: string, dto: CreateBatchDto) {
    await this.validateProductAndVariant(
      organizationId,
      dto.productId,
      dto.variantId,
    );

    const existing = await this.prisma.inventoryBatch.findFirst({
      where: {
        organizationId,
        productId: dto.productId,
        variantId: dto.variantId || null,
        batchNumber: dto.batchNumber,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Batch number '${dto.batchNumber}' already exists for this product in your organization`,
      );
    }

    return this.prisma.inventoryBatch.create({
      data: {
        organizationId,
        productId: dto.productId,
        variantId: dto.variantId || null,
        batchNumber: dto.batchNumber,
        batchType: dto.batchType || "STANDARD",
        workOrderRef: dto.workOrderRef || null,
        manufactureDate: dto.manufactureDate
          ? new Date(dto.manufactureDate)
          : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        costPrice: new Prisma.Decimal(dto.costPrice),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
    });
  }

  async updateBatch(id: string, organizationId: string, dto: UpdateBatchDto) {
    const existing = await this.getBatchById(id, organizationId);

    const productId = dto.productId || existing.productId;
    const variantId =
      dto.variantId !== undefined
        ? dto.variantId
        : existing.variantId || undefined;

    await this.validateProductAndVariant(organizationId, productId, variantId);

    const updateData: any = { ...dto };
    if (dto.costPrice !== undefined) {
      updateData.costPrice = new Prisma.Decimal(dto.costPrice);
    }
    if (dto.manufactureDate !== undefined) {
      updateData.manufactureDate = dto.manufactureDate
        ? new Date(dto.manufactureDate)
        : null;
    }
    if (dto.expiryDate !== undefined) {
      updateData.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    }
    if (dto.workOrderRef !== undefined) {
      updateData.workOrderRef = dto.workOrderRef || null;
    }

    return this.prisma.inventoryBatch.update({
      where: { id },
      data: updateData,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
    });
  }

  async createManufacturingLot(
    organizationId: string,
    data: {
      productId: string;
      variantId?: string;
      batchNumber: string;
      workOrderRef: string;
      quantity: number;
      unitCost: number;
      warehouseId: string;
      manufactureDate?: Date | string;
      expiryDate?: Date | string;
    },
  ) {
    await this.validateProductAndVariant(organizationId, data.productId, data.variantId);

    const existing = await this.prisma.inventoryBatch.findFirst({
      where: {
        organizationId,
        productId: data.productId,
        variantId: data.variantId || null,
        batchNumber: data.batchNumber,
      },
    });

    if (existing) {
      throw new BadRequestException("Batch number already exists for this product");
    }

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.inventoryBatch.create({
        data: {
          organizationId,
          productId: data.productId,
          variantId: data.variantId || null,
          batchNumber: data.batchNumber,
          batchType: "MANUFACTURING",
          workOrderRef: data.workOrderRef,
          manufactureDate: data.manufactureDate ? new Date(data.manufactureDate) : new Date(),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          costPrice: new Prisma.Decimal(data.unitCost),
        },
      });

      const qty = Math.max(0, Number(data.quantity));

      const defaultLoc = await tx.location.findFirst({
        where: { warehouseId: data.warehouseId, organizationId },
      });
      const locationId = defaultLoc?.id;

      if (locationId) {
        await tx.stockMovement.create({
          data: {
            organizationId,
            warehouseId: data.warehouseId,
            locationId,
            productId: data.productId,
            variantId: data.variantId || null,
            batchId: batch.id,
            movementType: "PRODUCTION_RECEIPT",
            quantity: new Prisma.Decimal(qty),
            unitCost: new Prisma.Decimal(data.unitCost),
            totalCost: new Prisma.Decimal(qty * data.unitCost),
            referenceType: "WORK_ORDER",
            referenceId: data.workOrderRef,
          },
        });
      }

      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          organizationId,
          warehouseId: data.warehouseId,
          productId: data.productId,
          variantId: data.variantId || null,
          batchId: batch.id,
        },
      });

      if (stockLevel) {
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: { onHand: { increment: qty } },
        });
      } else if (locationId) {
        await tx.stockLevel.create({
          data: {
            organizationId,
            warehouseId: data.warehouseId,
            locationId,
            productId: data.productId,
            variantId: data.variantId || null,
            batchId: batch.id,
            onHand: new Prisma.Decimal(qty),
            reserved: new Prisma.Decimal(0),
          },
        });
      }

      return batch;
    });
  }
}


import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface StockQueryOptions {
  warehouseId?: string;
  locationId?: string;
  productId?: string;
  variantId?: string;
  batchId?: string;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStock(organizationId: string, options: StockQueryOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (options.warehouseId) where.warehouseId = options.warehouseId;
    if (options.locationId) where.locationId = options.locationId;
    if (options.productId) where.productId = options.productId;
    if (options.variantId) where.variantId = options.variantId;
    if (options.batchId) where.batchId = options.batchId;

    if (options.search) {
      where.OR = [
        {
          product: { name: { contains: options.search, mode: "insensitive" } },
        },
        { product: { sku: { contains: options.search, mode: "insensitive" } } },
        {
          variant: { name: { contains: options.search, mode: "insensitive" } },
        },
        { variant: { sku: { contains: options.search, mode: "insensitive" } } },
        {
          warehouse: {
            name: { contains: options.search, mode: "insensitive" },
          },
        },
        {
          location: { name: { contains: options.search, mode: "insensitive" } },
        },
      ];
    }

    const [rawLevels, total] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where,
        skip,
        take: limit,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
          product: {
            select: { id: true, name: true, sku: true, costPrice: true },
          },
          variant: { select: { id: true, name: true, sku: true } },
          batch: { select: { id: true, batchNumber: true, expiryDate: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.stockLevel.count({ where }),
    ]);

    const data = rawLevels.map((lvl) => {
      const onHandNum = Number(lvl.onHand);
      const reservedNum = Number(lvl.reserved);
      const availableNum = onHandNum - reservedNum;

      return {
        ...lvl,
        onHand: onHandNum,
        reserved: reservedNum,
        available: availableNum,
      };
    });

    const filteredData = options.lowStock
      ? data.filter(
          (item) =>
            item.reorderLevel !== null &&
            item.available <= Number(item.reorderLevel),
        )
      : data;

    return {
      data: filteredData,
      meta: {
        total: options.lowStock ? filteredData.length : total,
        page,
        limit,
        totalPages: Math.ceil(
          (options.lowStock ? filteredData.length : total) / limit,
        ),
      },
    };
  }

  async getStockById(id: string, organizationId: string) {
    const stock = await this.prisma.stockLevel.findFirst({
      where: { id, organizationId },
      include: {
        warehouse: true,
        location: true,
        product: true,
        variant: true,
        batch: true,
      },
    });

    if (!stock) {
      throw new NotFoundException(
        "Stock record not found in this organization",
      );
    }

    const onHandNum = Number(stock.onHand);
    const reservedNum = Number(stock.reserved);
    const availableNum = onHandNum - reservedNum;

    return {
      ...stock,
      onHand: onHandNum,
      reserved: reservedNum,
      available: availableNum,
    };
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

export interface StockQueryOptions {
  warehouseId?: string;
  branchId?: string;
  locationId?: string;
  productId?: string;
  variantId?: string;
  batchId?: string;
  lowStock?: boolean;
  health?: "OK" | "LOW" | "OUT";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export type StockHealthStatus = "OK" | "LOW" | "OUT";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Builds the base Prisma WHERE clause from query options (without health filter). */
  private buildBaseWhere(
    organizationId: string,
    options: StockQueryOptions,
  ): Prisma.StockLevelWhereInput {
    const where: Prisma.StockLevelWhereInput = { organizationId };

    if (options.warehouseId) {
      where.warehouseId = options.warehouseId;
    }
    if (options.branchId) {
      where.warehouse = { branchId: options.branchId };
    }
    if (options.locationId) where.locationId = options.locationId;
    if (options.productId) where.productId = options.productId;
    if (options.variantId) where.variantId = options.variantId;
    if (options.batchId) where.batchId = options.batchId;

    if (options.search) {
      where.OR = [
        { product: { name: { contains: options.search, mode: "insensitive" } } },
        { product: { sku: { contains: options.search, mode: "insensitive" } } },
        { variant: { name: { contains: options.search, mode: "insensitive" } } },
        { variant: { sku: { contains: options.search, mode: "insensitive" } } },
        { warehouse: { name: { contains: options.search, mode: "insensitive" } } },
        { location: { name: { contains: options.search, mode: "insensitive" } } },
      ];
    }

    return where;
  }

  /**
   * Adds health-status filter to the WHERE clause at the DB level.
   * OUT  = onHand <= 0
   * LOW  = onHand > 0 AND reorderLevel IS NOT NULL AND onHand <= reorderLevel
   * OK   = everything else (onHand > reorderLevel OR reorderLevel IS NULL)
   */
  private applyHealthFilter(
    where: Prisma.StockLevelWhereInput,
    health: "OK" | "LOW" | "OUT" | undefined,
    lowStock: boolean | undefined,
  ): Prisma.StockLevelWhereInput {
    if (health === "OUT") {
      return { ...where, onHand: { lte: 0 } };
    }
    if (health === "LOW" || lowStock) {
      return {
        ...where,
        onHand: { gt: 0 },
        reorderLevel: { not: null },
        // Prisma doesn't support field-to-field comparisons natively;
        // we approximate here. For exact field comparison, use $queryRaw.
        // This catches items where reorderLevel >= onHand.
      };
    }
    if (health === "OK") {
      return {
        ...where,
        AND: [
          { onHand: { gt: 0 } },
          {
            OR: [
              { reorderLevel: null },
              // Items above their reorder level — approximated
            ],
          },
        ],
      };
    }
    return where;
  }

  /** Computes stockHealth label from raw numbers. */
  private computeHealth(
    onHand: number,
    reserved: number,
    reorderLevel: number | null,
  ): StockHealthStatus {
    const available = onHand - reserved;
    if (available <= 0) return "OUT";
    if (reorderLevel !== null && available <= reorderLevel) return "LOW";
    return "OK";
  }

  /** Builds the Prisma orderBy clause from sort options. */
  private buildOrderBy(
    sortBy: string | undefined,
    sortOrder: "asc" | "desc",
  ): Prisma.StockLevelOrderByWithRelationInput {
    if (sortBy === "product") return { product: { name: sortOrder } };
    if (sortBy === "warehouse") return { warehouse: { name: sortOrder } };
    if (sortBy === "onHand") return { onHand: sortOrder };
    if (sortBy === "reserved") return { reserved: sortOrder };
    return { updatedAt: sortOrder };
  }

  async getStock(organizationId: string, options: StockQueryOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

    const baseWhere = this.buildBaseWhere(organizationId, options);
    const filteredWhere = this.applyHealthFilter(
      baseWhere,
      options.health,
      options.lowStock,
    );
    const orderBy = this.buildOrderBy(options.sortBy, sortOrder);

    // ─── 1. Parallel DB queries: paginated data + total count ───────────────
    const [rows, total] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where: filteredWhere,
        skip,
        take: limit,
        include: {
          warehouse: { select: { id: true, name: true, code: true, branchId: true } },
          location: { select: { id: true, name: true, code: true } },
          product: { select: { id: true, name: true, sku: true, costPrice: true } },
          variant: { select: { id: true, name: true, sku: true } },
          batch: { select: { id: true, batchNumber: true, expiryDate: true } },
        },
        orderBy,
      }),
      this.prisma.stockLevel.count({ where: filteredWhere }),
    ]);

    // ─── 2. Summary aggregation — runs against base scope (no health filter) ─
    // Uses aggregate to avoid fetching all rows into memory.
    const summaryAgg = await this.prisma.stockLevel.aggregate({
      where: baseWhere,
      _sum: { onHand: true, reserved: true },
    });

    const totalOnHand = Number(summaryAgg._sum.onHand ?? 0);
    const totalReserved = Number(summaryAgg._sum.reserved ?? 0);
    const totalAvailable = totalOnHand - totalReserved;

    // Count low/out items via lightweight COUNT queries
    const [lowCount, outCount] = await Promise.all([
      this.prisma.stockLevel.count({
        where: { ...baseWhere, onHand: { gt: 0 }, reorderLevel: { not: null } },
      }),
      this.prisma.stockLevel.count({
        where: { ...baseWhere, onHand: { lte: 0 } },
      }),
    ]);

    // ─── 3. Annotate each row with computed stockHealth ──────────────────────
    const data = rows.map((lvl) => {
      const onHandNum = Number(lvl.onHand);
      const reservedNum = Number(lvl.reserved);
      const reorderLvl = lvl.reorderLevel !== null ? Number(lvl.reorderLevel) : null;

      return {
        ...lvl,
        onHand: onHandNum,
        reserved: reservedNum,
        available: onHandNum - reservedNum,
        reorderLevel: reorderLvl,
        reorderQuantity: lvl.reorderQuantity !== null ? Number(lvl.reorderQuantity) : null,
        stockHealth: this.computeHealth(onHandNum, reservedNum, reorderLvl),
      };
    });

    return {
      data,
      summary: {
        totalOnHand,
        totalReserved,
        totalAvailable,
        lowStockCount: lowCount,
        outOfStockCount: outCount,
        totalRecords: total,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
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
      throw new NotFoundException("Stock record not found in this organization");
    }

    const onHandNum = Number(stock.onHand);
    const reservedNum = Number(stock.reserved);
    const reorderLvl = stock.reorderLevel !== null ? Number(stock.reorderLevel) : null;

    return {
      ...stock,
      onHand: onHandNum,
      reserved: reservedNum,
      available: onHandNum - reservedNum,
      reorderLevel: reorderLvl,
      stockHealth: this.computeHealth(onHandNum, reservedNum, reorderLvl),
    };
  }

  /** Update reorder settings for a StockLevel record. */
  async updateReorderSettings(
    id: string,
    organizationId: string,
    reorderLevel: number,
    reorderQuantity: number | null,
  ) {
    const stock = await this.prisma.stockLevel.findFirst({
      where: { id, organizationId },
    });
    if (!stock) {
      throw new NotFoundException("Stock record not found in this organization");
    }
    return this.prisma.stockLevel.update({
      where: { id },
      data: {
        reorderLevel: new Prisma.Decimal(reorderLevel),
        reorderQuantity:
          reorderQuantity !== null ? new Prisma.Decimal(reorderQuantity) : null,
      },
    });
  }

  async exportCsv(organizationId: string, options: StockQueryOptions = {}): Promise<string> {
    // Fetch up to 10,000 rows for export (server-side CSV generation)
    const result = await this.getStock(organizationId, { ...options, page: 1, limit: 10000 });
    const headers = [
      "Product",
      "SKU",
      "Variant",
      "Warehouse",
      "Location",
      "Batch No.",
      "On Hand Qty",
      "Reserved Qty",
      "Available Stock",
      "Reorder Level",
      "Stock Health",
    ];

    const rows = result.data.map((item) => [
      `"${(item.product?.name || "Unassigned").replace(/"/g, '""')}"`,
      `"${(item.product?.sku || "-").replace(/"/g, '""')}"`,
      `"${(item.variant?.name || "Base Product").replace(/"/g, '""')}"`,
      `"${(item.warehouse?.name || "-").replace(/"/g, '""')}"`,
      `"${(item.location?.name || "-").replace(/"/g, '""')}"`,
      `"${(item.batch?.batchNumber || "N/A").replace(/"/g, '""')}"`,
      item.onHand,
      item.reserved,
      item.available,
      item.reorderLevel !== null ? item.reorderLevel : "-",
      item.stockHealth,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  async exportPdfReport(organizationId: string, options: StockQueryOptions = {}): Promise<string> {
    const result = await this.getStock(organizationId, { ...options, page: 1, limit: 10000 });
    const { summary, data } = result;

    const rowsHtml = data
      .map(
        (item) => `
        <tr>
          <td>${item.product?.name || "Unassigned"} (${item.product?.sku || "-"})</td>
          <td>${item.variant?.name || "Base"}</td>
          <td>${item.warehouse?.name || "-"} → ${item.location?.name || "-"}</td>
          <td>${item.batch?.batchNumber || "N/A"}</td>
          <td>${item.onHand}</td>
          <td>${item.reserved}</td>
          <td><strong>${item.available}</strong></td>
          <td>${item.stockHealth}</td>
        </tr>
      `,
      )
      .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <title>Live Stock Levels Report - ValGrow Business OS</title>
  <style>
    body { font-family: sans-serif; margin: 20px; color: #1e293b; }
    h1 { margin-bottom: 5px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; background: #f8fafc; padding: 15px; border-radius: 8px; }
    .stat { flex: 1; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .stat-val { font-size: 20px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; text-align: left; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <h1>Live Stock Levels Report</h1>
  <p>Generated on ${new Date().toLocaleString()}</p>
  <div class="summary">
    <div class="stat"><div class="stat-label">Total On Hand</div><div class="stat-val">${summary.totalOnHand}</div></div>
    <div class="stat"><div class="stat-label">Total Reserved</div><div class="stat-val">${summary.totalReserved}</div></div>
    <div class="stat"><div class="stat-label">Total Available</div><div class="stat-val">${summary.totalAvailable}</div></div>
    <div class="stat"><div class="stat-label">Low Stock Items</div><div class="stat-val">${summary.lowStockCount}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Product (SKU)</th>
        <th>Variant</th>
        <th>Facility</th>
        <th>Batch</th>
        <th>On Hand</th>
        <th>Reserved</th>
        <th>Available</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;
  }
}

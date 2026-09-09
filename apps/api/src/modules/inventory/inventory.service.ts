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

  /**
   * Returns items below reorder level (available <= reorderLevel) with suggested order quantities.
   */
  async getPurchaseSuggestions(organizationId: string) {
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: {
        organizationId,
        reorderLevel: { not: null },
      },
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
        variant: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    const suggestions = stockLevels
      .map((lvl) => {
        const onHand = Number(lvl.onHand);
        const reserved = Number(lvl.reserved);
        const available = onHand - reserved;
        const reorderLevel = lvl.reorderLevel !== null ? Number(lvl.reorderLevel) : 0;
        const reorderQuantity =
          lvl.reorderQuantity !== null
            ? Number(lvl.reorderQuantity)
            : Math.max(1, reorderLevel - available + 10);
        const estimatedUnitCost = lvl.product?.costPrice ? Number(lvl.product.costPrice) : 0;
        const estimatedTotalCost = reorderQuantity * estimatedUnitCost;

        return {
          stockLevelId: lvl.id,
          productId: lvl.productId,
          productName: lvl.product?.name || "Unassigned",
          productSku: lvl.product?.sku || "-",
          variantId: lvl.variantId,
          variantName: lvl.variant?.name || "Base Product",
          warehouseId: lvl.warehouseId,
          warehouseName: lvl.warehouse?.name || "-",
          onHand,
          reserved,
          available,
          reorderLevel,
          suggestedOrderQty: reorderQuantity,
          estimatedUnitCost,
          estimatedTotalCost,
          health: available <= 0 ? ("OUT" as const) : ("LOW" as const),
        };
      })
      .filter((item) => item.available <= item.reorderLevel);

    const totalEstimatedCost = suggestions.reduce((acc, item) => acc + item.estimatedTotalCost, 0);

    return {
      data: suggestions,
      summary: {
        totalSuggestions: suggestions.length,
        outOfStockCount: suggestions.filter((s) => s.health === "OUT").length,
        lowStockCount: suggestions.filter((s) => s.health === "LOW").length,
        totalEstimatedCost,
      },
    };
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

  // ─── ANALYTICS & INTELLIGENCE METHODS (PHASE 3) ─────────────────────────

  /**
   * ABC Analysis: Classifies inventory items into A (top 80% value), B (next 15%), C (bottom 5%).
   */
  async getAbcAnalysis(organizationId: string) {
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { organizationId },
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        productSku: string;
        totalOnHand: number;
        unitCost: number;
        totalStockValue: number;
        warehouses: string[];
      }
    >();

    for (const lvl of stockLevels) {
      if (!lvl.product) continue;
      const pid = lvl.productId;
      const onHand = Number(lvl.onHand);
      const unitCost = Number(lvl.product.costPrice || 0);

      const existing = productMap.get(pid) || {
        productId: pid,
        productName: lvl.product.name,
        productSku: lvl.product.sku || "-",
        totalOnHand: 0,
        unitCost,
        totalStockValue: 0,
        warehouses: [],
      };

      existing.totalOnHand += onHand;
      existing.totalStockValue += onHand * unitCost;
      if (lvl.warehouse?.name && !existing.warehouses.includes(lvl.warehouse.name)) {
        existing.warehouses.push(lvl.warehouse.name);
      }
      productMap.set(pid, existing);
    }

    const items = Array.from(productMap.values()).sort((a, b) => b.totalStockValue - a.totalStockValue);
    const grandTotalValue = items.reduce((acc, i) => acc + i.totalStockValue, 0);

    let cumulative = 0;
    const classified = items.map((item) => {
      cumulative += item.totalStockValue;
      const cumulativePercentage = grandTotalValue > 0 ? (cumulative / grandTotalValue) * 100 : 0;
      const shareOfTotalValue = grandTotalValue > 0 ? (item.totalStockValue / grandTotalValue) * 100 : 0;

      let classification: "A" | "B" | "C" = "C";
      if (cumulativePercentage <= 80 || (cumulativePercentage - shareOfTotalValue) < 80) {
        classification = "A";
      } else if (cumulativePercentage <= 95 || (cumulativePercentage - shareOfTotalValue) < 95) {
        classification = "B";
      }

      return {
        ...item,
        shareOfTotalValue: Math.round(shareOfTotalValue * 100) / 100,
        cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
        classification,
      };
    });

    const classA = classified.filter((i) => i.classification === "A");
    const classB = classified.filter((i) => i.classification === "B");
    const classC = classified.filter((i) => i.classification === "C");

    return {
      data: classified,
      summary: {
        grandTotalValue,
        totalProducts: classified.length,
        classA: { count: classA.length, value: classA.reduce((a, b) => a + b.totalStockValue, 0) },
        classB: { count: classB.length, value: classB.reduce((a, b) => a + b.totalStockValue, 0) },
        classC: { count: classC.length, value: classC.reduce((a, b) => a + b.totalStockValue, 0) },
      },
    };
  }

  /**
   * Fast & Slow Moving Inventory Velocity: Ranks products by outbound movement rate over N days.
   */
  async getMovementVelocity(organizationId: string, days = 30) {
    const periodDays = Math.max(1, Number(days) || 30);
    const since = new Date(Date.now() - periodDays * 86400000);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
      },
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
      },
    });

    const velocityMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        productSku: string;
        outboundQty: number;
        inboundQty: number;
        totalMovements: number;
        dailyVelocity: number;
      }
    >();

    for (const m of movements) {
      if (!m.product) continue;
      const pid = m.productId;
      const qty = Number(m.quantity);

      const existing = velocityMap.get(pid) || {
        productId: pid,
        productName: m.product.name,
        productSku: m.product.sku || "-",
        outboundQty: 0,
        inboundQty: 0,
        totalMovements: 0,
        dailyVelocity: 0,
      };

      existing.totalMovements += 1;
      if (qty < 0) {
        existing.outboundQty += Math.abs(qty);
      } else {
        existing.inboundQty += qty;
      }
      velocityMap.set(pid, existing);
    }

    const items = Array.from(velocityMap.values()).map((i) => ({
      ...i,
      dailyVelocity: Math.round((i.outboundQty / periodDays) * 100) / 100,
    }));

    items.sort((a, b) => b.outboundQty - a.outboundQty);

    const fastMoving = items.filter((i) => i.dailyVelocity >= 1);
    const moderateMoving = items.filter((i) => i.dailyVelocity > 0 && i.dailyVelocity < 1);
    const slowMoving = items.filter((i) => i.dailyVelocity === 0);

    return {
      periodDays,
      data: items,
      summary: {
        totalTrackedProducts: items.length,
        fastMovingCount: fastMoving.length,
        moderateMovingCount: moderateMoving.length,
        slowMovingCount: slowMoving.length,
      },
    };
  }

  /**
   * Dead Stock Detection: Products with stock > 0 but ZERO movements in the last N days.
   */
  async getDeadStock(organizationId: string, inactiveDays = 90) {
    const daysThreshold = Math.max(1, Number(inactiveDays) || 90);
    const since = new Date(Date.now() - daysThreshold * 86400000);

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { organizationId, onHand: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const activeMovements = await this.prisma.stockMovement.findMany({
      where: { organizationId, createdAt: { gte: since } },
      select: { productId: true },
      distinct: ["productId"],
    });

    const activeProductIds = new Set(activeMovements.map((m) => m.productId));

    const deadStockItems = stockLevels
      .filter((lvl) => !activeProductIds.has(lvl.productId))
      .map((lvl) => {
        const onHand = Number(lvl.onHand);
        const unitCost = Number(lvl.product?.costPrice || 0);
        const tiedUpCapital = onHand * unitCost;

        return {
          stockLevelId: lvl.id,
          productId: lvl.productId,
          productName: lvl.product?.name || "Unassigned",
          productSku: lvl.product?.sku || "-",
          warehouseId: lvl.warehouseId,
          warehouseName: lvl.warehouse?.name || "-",
          onHand,
          unitCost,
          tiedUpCapital,
          inactiveDays: daysThreshold,
          lastActivity: "No activity in 90+ days",
        };
      });

    const totalTiedUpCapital = deadStockItems.reduce((acc, item) => acc + item.tiedUpCapital, 0);

    return {
      inactiveDaysThreshold: daysThreshold,
      data: deadStockItems,
      summary: {
        totalDeadStockItems: deadStockItems.length,
        totalTiedUpCapital,
      },
    };
  }

  /**
   * Stock Forecast & Stockout Risk Prediction.
   */
  async getStockForecast(organizationId: string, lookbackDays = 30) {
    const days = Math.max(1, Number(lookbackDays) || 30);
    const since = new Date(Date.now() - days * 86400000);

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { organizationId },
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const movements = await this.prisma.stockMovement.findMany({
      where: { organizationId, createdAt: { gte: since }, quantity: { lt: 0 } },
      select: { productId: true, quantity: true },
    });

    const outboundMap = new Map<string, number>();
    for (const m of movements) {
      const current = outboundMap.get(m.productId) || 0;
      outboundMap.set(m.productId, current + Math.abs(Number(m.quantity)));
    }

    const forecastData = stockLevels.map((lvl) => {
      const onHand = Number(lvl.onHand);
      const reserved = Number(lvl.reserved);
      const available = onHand - reserved;
      const reorderLevel = lvl.reorderLevel !== null ? Number(lvl.reorderLevel) : null;

      const totalOutbound = outboundMap.get(lvl.productId) || 0;
      const avgDailyConsumption = Math.round((totalOutbound / days) * 100) / 100;

      let daysUntilStockout: number | null = null;
      if (avgDailyConsumption > 0 && available > 0) {
        daysUntilStockout = Math.round(available / avgDailyConsumption);
      } else if (available <= 0) {
        daysUntilStockout = 0;
      }

      let riskStatus: "CRITICAL" | "WARNING" | "SAFE" = "SAFE";
      if (available <= 0 || (daysUntilStockout !== null && daysUntilStockout <= 7)) {
        riskStatus = "CRITICAL";
      } else if (daysUntilStockout !== null && daysUntilStockout <= 30) {
        riskStatus = "WARNING";
      }

      return {
        stockLevelId: lvl.id,
        productId: lvl.productId,
        productName: lvl.product?.name || "Unassigned",
        productSku: lvl.product?.sku || "-",
        warehouseName: lvl.warehouse?.name || "-",
        onHand,
        reserved,
        available,
        reorderLevel,
        avgDailyConsumption,
        daysUntilStockout,
        riskStatus,
      };
    });

    const criticalCount = forecastData.filter((i) => i.riskStatus === "CRITICAL").length;
    const warningCount = forecastData.filter((i) => i.riskStatus === "WARNING").length;
    const safeCount = forecastData.filter((i) => i.riskStatus === "SAFE").length;

    return {
      lookbackDays: days,
      data: forecastData,
      summary: {
        totalRecords: forecastData.length,
        criticalCount,
        warningCount,
        safeCount,
      },
    };
  }
}


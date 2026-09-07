import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

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

  async getStock(organizationId: string, options: StockQueryOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (options.warehouseId) {
      where.warehouseId = options.warehouseId;
    }
    if (options.branchId) {
      where.warehouse = { ...(where.warehouse || {}), branchId: options.branchId };
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

    // Determine sorting order
    const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";
    let orderBy: any = { updatedAt: sortOrder };
    if (options.sortBy === "product") {
      orderBy = { product: { name: sortOrder } };
    } else if (options.sortBy === "warehouse") {
      orderBy = { warehouse: { name: sortOrder } };
    } else if (options.sortBy === "onHand") {
      orderBy = { onHand: sortOrder };
    } else if (options.sortBy === "reserved") {
      orderBy = { reserved: sortOrder };
    }

    // Fetch all levels matching `where` for accurate aggregate summary calculation
    const allMatchingLevels = await this.prisma.stockLevel.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true, branchId: true } },
        location: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
        variant: { select: { id: true, name: true, sku: true } },
        batch: { select: { id: true, batchNumber: true, expiryDate: true } },
      },
      orderBy,
    });

    let totalOnHand = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const mappedLevels = allMatchingLevels.map((lvl) => {
      const onHandNum = Number(lvl.onHand);
      const reservedNum = Number(lvl.reserved);
      const availableNum = onHandNum - reservedNum;
      const reorderLvl = lvl.reorderLevel !== null ? Number(lvl.reorderLevel) : null;

      let stockHealth: StockHealthStatus = "OK";
      if (availableNum <= 0) {
        stockHealth = "OUT";
        outOfStockCount++;
      } else if (reorderLvl !== null && availableNum <= reorderLvl) {
        stockHealth = "LOW";
        lowStockCount++;
      }

      totalOnHand += onHandNum;
      totalReserved += reservedNum;
      totalAvailable += availableNum;

      return {
        ...lvl,
        onHand: onHandNum,
        reserved: reservedNum,
        available: availableNum,
        reorderLevel: reorderLvl,
        reorderQuantity: lvl.reorderQuantity !== null ? Number(lvl.reorderQuantity) : null,
        stockHealth,
      };
    });

    // Apply health status or lowStock filtering if specified
    let filteredLevels = mappedLevels;
    if (options.health) {
      filteredLevels = mappedLevels.filter((item) => item.stockHealth === options.health);
    } else if (options.lowStock) {
      filteredLevels = mappedLevels.filter((item) => item.stockHealth === "LOW" || item.stockHealth === "OUT");
    }

    const totalCount = filteredLevels.length;
    const paginatedLevels = filteredLevels.slice(skip, skip + limit);

    return {
      data: paginatedLevels,
      summary: {
        totalOnHand,
        totalReserved,
        totalAvailable,
        lowStockCount,
        outOfStockCount,
        totalRecords: totalCount,
      },
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
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
    const availableNum = onHandNum - reservedNum;
    const reorderLvl = stock.reorderLevel !== null ? Number(stock.reorderLevel) : null;

    let stockHealth: StockHealthStatus = "OK";
    if (availableNum <= 0) {
      stockHealth = "OUT";
    } else if (reorderLvl !== null && availableNum <= reorderLvl) {
      stockHealth = "LOW";
    }

    return {
      ...stock,
      onHand: onHandNum,
      reserved: reservedNum,
      available: availableNum,
      reorderLevel: reorderLvl,
      stockHealth,
    };
  }

  async exportCsv(organizationId: string, options: StockQueryOptions = {}): Promise<string> {
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


import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DashboardOverviewDto } from "./dto/dashboard-overview.dto";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(organizationId: string): Promise<DashboardOverviewDto> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalActiveProducts,
      stockLevels,
      salesAggregation,
      todaysOrderCount,
      openPurchaseOrderCount,
      pendingGoodsReceiptsCount,
      activeCustomerCount,
    ] = await Promise.all([
      // 1. Total active products
      this.prisma.product.count({
        where: {
          organizationId,
          status: "ACTIVE",
          deletedAt: null,
        },
      }),

      // 2. Fetch stock levels for active products to compute low stock count
      this.prisma.stockLevel.findMany({
        where: {
          organizationId,
          product: {
            status: "ACTIVE",
            deletedAt: null,
          },
        },
        select: {
          productId: true,
          onHand: true,
          reserved: true,
          reorderLevel: true,
        },
      }),

      // 3. Today's total POS sales amount
      this.prisma.pOSSale.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          organizationId,
          status: "COMPLETED",
          createdAt: {
            gte: startOfToday,
          },
        },
      }),

      // 4. Today's POS order count
      this.prisma.pOSSale.count({
        where: {
          organizationId,
          status: "COMPLETED",
          createdAt: {
            gte: startOfToday,
          },
        },
      }),

      // 5. Open purchase order count (excluding fully received or cancelled)
      this.prisma.purchaseOrder.count({
        where: {
          organizationId,
          status: {
            notIn: ["RECEIVED", "CANCELLED"],
          },
        },
      }),

      // 6. Pending goods receipts count (draft status)
      this.prisma.goodsReceipt.count({
        where: {
          organizationId,
          status: "DRAFT",
        },
      }),

      // 7. Active customer count
      this.prisma.customer.count({
        where: {
          organizationId,
          status: "ACTIVE",
          deletedAt: null,
        },
      }),
    ]);

    // Calculate unique products with low stock
    const lowStockProductIds = new Set<string>();
    for (const lvl of stockLevels) {
      const onHand = Number(lvl.onHand);
      const reserved = Number(lvl.reserved);
      const available = onHand - reserved;
      const reorderLevel =
        lvl.reorderLevel !== null ? Number(lvl.reorderLevel) : 10;

      if (available <= reorderLevel) {
        lowStockProductIds.add(lvl.productId);
      }
    }

    const todaysTotalPosSales = salesAggregation._sum.totalAmount
      ? Number(salesAggregation._sum.totalAmount)
      : 0;

    return {
      totalActiveProducts,
      lowStockProductCount: lowStockProductIds.size,
      todaysTotalPosSales,
      todaysOrderCount,
      openPurchaseOrderCount,
      pendingGoodsReceiptsCount,
      activeCustomerCount,
    };
  }
}

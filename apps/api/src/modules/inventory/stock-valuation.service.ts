import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, ValuationMethod } from "@prisma/client";

export interface ConsumeLayersResult {
  calculatedUnitCost: number;
  totalCostImpact: number;
}

export interface ValuationReportItem {
  productId: string;
  productName: string;
  productSku: string | null;
  totalQtyOnHand: number;
  weightedUnitCost: number;
  totalInventoryValue: number;
}

/**
 * StockValuationService
 * ─────────────────────
 * Shared, reusable FIFO / LIFO / Weighted-Average engine used by:
 *  • InventoryAdjustmentsService
 *  • DeliveryNotesService
 *  • SalesReturnsService
 *  • any future module that needs cost layer consumption
 *
 * All methods that touch InventoryCostLayer accept a Prisma TransactionClient
 * so they can be composed safely inside larger $transaction blocks.
 */
@Injectable()
export class StockValuationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds a new cost layer when stock comes IN (purchase receipt, opening balance, etc.)
   * Call this inside a $transaction for atomicity.
   */
  async addCostLayer(
    tx: Prisma.TransactionClient,
    params: {
      organizationId: string;
      warehouseId: string;
      locationId: string;
      productId: string;
      variantId?: string | null;
      batchId?: string | null;
      qty: Prisma.Decimal | number;
      unitCost: Prisma.Decimal | number;
      baseUnitCost?: Prisma.Decimal | number | null;
      landedCostPerUnit?: Prisma.Decimal | number;
    },
  ): Promise<void> {
    const qty = new Prisma.Decimal(params.qty);
    const unitCost = new Prisma.Decimal(params.unitCost);

    await tx.inventoryCostLayer.create({
      data: {
        organizationId: params.organizationId,
        warehouseId: params.warehouseId,
        locationId: params.locationId,
        productId: params.productId,
        variantId: params.variantId ?? null,
        batchId: params.batchId ?? null,
        initialQty: qty,
        remainingQty: qty,
        baseUnitCost: params.baseUnitCost ? new Prisma.Decimal(params.baseUnitCost) : unitCost,
        landedCostPerUnit: params.landedCostPerUnit
          ? new Prisma.Decimal(params.landedCostPerUnit)
          : new Prisma.Decimal(0),
        unitCost,
        status: "ACTIVE",
      },
    });
  }

  /**
   * Consumes cost layers (FIFO / LIFO / Weighted-Average) for outbound stock.
   * Updates `remainingQty` and sets layers to EXHAUSTED when depleted.
   * Returns the weighted unit cost and total cost impact (always negative for deductions).
   *
   * @param tx           - Prisma transaction client
   * @param orgId        - Organization scope
   * @param method       - FIFO | LIFO | WEIGHTED_AVERAGE
   * @param item         - Product/location/quantity details
   */
  async consumeCostLayers(
    tx: Prisma.TransactionClient,
    orgId: string,
    method: ValuationMethod,
    item: {
      productId: string;
      variantId?: string | null;
      locationId: string;
      batchId?: string | null;
      qtyToDeduct: number;
      fallbackUnitCost?: number;
    },
  ): Promise<ConsumeLayersResult> {
    const { qtyToDeduct, fallbackUnitCost = 0 } = item;

    if (qtyToDeduct <= 0) {
      return { calculatedUnitCost: fallbackUnitCost, totalCostImpact: 0 };
    }

    const activeLayers = await tx.inventoryCostLayer.findMany({
      where: {
        organizationId: orgId,
        productId: item.productId,
        locationId: item.locationId,
        variantId: item.variantId ?? null,
        batchId: item.batchId ?? null,
        status: "ACTIVE",
        remainingQty: { gt: 0 },
      },
      orderBy: {
        // LIFO = newest first (desc), FIFO & WA = oldest first (asc)
        receivedAt: method === "LIFO" ? "desc" : "asc",
      },
    });

    if (activeLayers.length === 0) {
      return {
        calculatedUnitCost: fallbackUnitCost,
        totalCostImpact: -(qtyToDeduct * fallbackUnitCost),
      };
    }

    // ── Weighted Average ────────────────────────────────────────────────────
    if (method === "WEIGHTED_AVERAGE") {
      let totalRemainingQty = 0;
      let totalRemainingValue = 0;
      for (const layer of activeLayers) {
        const rQty = Number(layer.remainingQty);
        const uCost = Number(layer.unitCost);
        totalRemainingQty += rQty;
        totalRemainingValue += rQty * uCost;
      }
      const weightedAvgCost =
        totalRemainingQty > 0
          ? totalRemainingValue / totalRemainingQty
          : fallbackUnitCost;

      // Deplete layers sequentially in DB
      let remaining = qtyToDeduct;
      for (const layer of activeLayers) {
        if (remaining <= 0) break;
        const layerQty = Number(layer.remainingQty);
        const deduct = Math.min(layerQty, remaining);
        const newRemaining = layerQty - deduct;

        await tx.inventoryCostLayer.update({
          where: { id: layer.id },
          data: {
            remainingQty: new Prisma.Decimal(newRemaining),
            status: newRemaining === 0 ? "EXHAUSTED" : "ACTIVE",
          },
        });
        remaining -= deduct;
      }

      return {
        calculatedUnitCost: weightedAvgCost,
        totalCostImpact: -(qtyToDeduct * weightedAvgCost),
      };
    }

    // ── FIFO / LIFO layer deduction ─────────────────────────────────────────
    let remaining = qtyToDeduct;
    let totalDeductedCost = 0;

    for (const layer of activeLayers) {
      if (remaining <= 0) break;
      const layerQty = Number(layer.remainingQty);
      const layerUnitCost = Number(layer.unitCost);
      const deduct = Math.min(layerQty, remaining);
      const newRemaining = layerQty - deduct;

      await tx.inventoryCostLayer.update({
        where: { id: layer.id },
        data: {
          remainingQty: new Prisma.Decimal(newRemaining),
          status: newRemaining === 0 ? "EXHAUSTED" : "ACTIVE",
        },
      });

      totalDeductedCost += deduct * layerUnitCost;
      remaining -= deduct;
    }

    // If deduction exceeds available layers, use fallback cost
    if (remaining > 0) {
      totalDeductedCost += remaining * fallbackUnitCost;
    }

    const calculatedAvgUnitCost =
      qtyToDeduct > 0 ? totalDeductedCost / qtyToDeduct : fallbackUnitCost;

    return {
      calculatedUnitCost: calculatedAvgUnitCost,
      totalCostImpact: -totalDeductedCost,
    };
  }

  /**
   * Convenience wrapper: calculates cost for a positive OR negative qty
   * (used by StockAdjustments where either inbound or outbound can happen).
   */
  async calculateItemValuationCost(
    tx: Prisma.TransactionClient,
    organizationId: string,
    valuationMethod: ValuationMethod,
    item: {
      productId: string;
      variantId?: string | null;
      locationId: string;
      batchId?: string | null;
      adjustedQty: number;   // positive = stock gain, negative = stock loss
      fallbackUnitCost: number;
    },
  ): Promise<ConsumeLayersResult> {
    const diffQty = item.adjustedQty;

    if (diffQty === 0) {
      return { calculatedUnitCost: item.fallbackUnitCost, totalCostImpact: 0 };
    }

    // Positive adjustment: stock is being added at provided cost
    if (diffQty > 0) {
      const unitCost = item.fallbackUnitCost || 0;
      return {
        calculatedUnitCost: unitCost,
        totalCostImpact: diffQty * unitCost,
      };
    }

    // Negative adjustment: consume cost layers
    return this.consumeCostLayers(tx, organizationId, valuationMethod, {
      productId: item.productId,
      variantId: item.variantId,
      locationId: item.locationId,
      batchId: item.batchId,
      qtyToDeduct: Math.abs(diffQty),
      fallbackUnitCost: item.fallbackUnitCost,
    });
  }

  /**
   * Returns the org-level valuation method (defaults to FIFO).
   */
  async getValuationMethod(organizationId: string): Promise<ValuationMethod> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { valuationMethod: true },
    });
    return org?.valuationMethod ?? "FIFO";
  }

  /**
   * Returns the current weighted-average unit cost for a product in a warehouse.
   * Used for analytics and reporting.
   */
  async getWeightedAverageCost(
    organizationId: string,
    productId: string,
    warehouseId?: string,
  ): Promise<number> {
    const where: Prisma.InventoryCostLayerWhereInput = {
      organizationId,
      productId,
      status: "ACTIVE",
      remainingQty: { gt: 0 },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const layers = await this.prisma.inventoryCostLayer.findMany({ where });

    if (layers.length === 0) return 0;

    let totalQty = 0;
    let totalValue = 0;
    for (const l of layers) {
      const qty = Number(l.remainingQty);
      totalQty += qty;
      totalValue += qty * Number(l.unitCost);
    }

    return totalQty > 0 ? totalValue / totalQty : 0;
  }

  /**
   * Inventory Valuation Report
   * Returns per-product stock value at the current moment.
   */
  async getInventoryValuation(
    organizationId: string,
    warehouseId?: string,
  ): Promise<{
    totalInventoryValue: number;
    items: ValuationReportItem[];
  }> {
    const stockWhere: Prisma.StockLevelWhereInput = {
      organizationId,
      onHand: { gt: 0 },
    };
    if (warehouseId) stockWhere.warehouseId = warehouseId;

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: stockWhere,
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
      },
    });

    // Group by product, aggregate on-hand qty
    const byProduct = new Map<
      string,
      { product: { id: string; name: string; sku: string | null; costPrice: any }; totalOnHand: number }
    >();

    for (const sl of stockLevels) {
      if (!sl.product) continue;
      const existing = byProduct.get(sl.productId);
      const onHand = Number(sl.onHand);
      if (existing) {
        existing.totalOnHand += onHand;
      } else {
        byProduct.set(sl.productId, { product: sl.product, totalOnHand: onHand });
      }
    }

    const items: ValuationReportItem[] = [];
    let totalInventoryValue = 0;

    for (const [productId, info] of byProduct) {
      const weightedCost = await this.getWeightedAverageCost(organizationId, productId, warehouseId);
      const fallback = Number(info.product.costPrice ?? 0);
      const unitCost = weightedCost > 0 ? weightedCost : fallback;
      const productValue = info.totalOnHand * unitCost;
      totalInventoryValue += productValue;

      items.push({
        productId,
        productName: info.product.name,
        productSku: info.product.sku,
        totalQtyOnHand: info.totalOnHand,
        weightedUnitCost: unitCost,
        totalInventoryValue: productValue,
      });
    }

    // Sort by value descending
    items.sort((a, b) => b.totalInventoryValue - a.totalInventoryValue);

    return { totalInventoryValue, items };
  }
}

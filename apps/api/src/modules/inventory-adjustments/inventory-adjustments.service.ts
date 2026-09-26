import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JournalEntriesService } from "../journal-entries/journal-entries.service";
import { StockValuationService } from "../inventory/stock-valuation.service";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { Prisma, ValuationMethod } from "@prisma/client";

@Injectable()
export class InventoryAdjustmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalEntriesService: JournalEntriesService,
    private readonly stockValuationService: StockValuationService,
  ) {}

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

  async getAdjustments(
    organizationId: string,
    search?: string,
    reason?: string,
    warehouseId?: string,
  ) {
    const where: Prisma.StockAdjustmentWhereInput = { organizationId };

    if (reason) {
      where.reason = reason as any;
    }
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }
    if (search) {
      where.OR = [
        { adjustmentNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { warehouse: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    return this.prisma.stockAdjustment.findMany({
      where,
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
            variant: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAdjustmentById(id: string, organizationId: string) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id, organizationId },
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
            variant: true,
            location: true,
          },
        },
      },
    });

    if (!adjustment) {
      throw new NotFoundException(
        "Stock adjustment record not found in this organization",
      );
    }

    return adjustment;
  }

  // NOTE: Valuation engine logic has been moved to the shared StockValuationService.
  // This service now delegates all FIFO/LIFO/WA computation to that shared service.

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

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { valuationMethod: true },
    });
    const valuationMethod: ValuationMethod = org?.valuationMethod || "FIFO";

    return this.prisma.$transaction(async (tx) => {
      // 1. Process line item valuations
      const processedItems: Array<{
        locationId: string;
        productId: string;
        variantId: string | null;
        batchId: string | null;
        currentQty: number;
        adjustedQty: number;
        newQty: number;
        calculatedUnitCost: number;
        costImpact: number;
      }> = [];

      for (const item of dto.items) {
        const diffQty = Number(item.adjustedQty);
        const fallbackCost = Number(item.unitCost || 0);

        const { calculatedUnitCost, totalCostImpact } =
          await this.stockValuationService.calculateItemValuationCost(
            tx,
            organizationId,
            valuationMethod,
            {
              productId: item.productId,
              variantId: item.variantId,
              locationId: item.locationId,
              batchId: item.batchId,
              adjustedQty: diffQty,
              fallbackUnitCost: fallbackCost,
            },
          );

        processedItems.push({
          locationId: item.locationId,
          productId: item.productId,
          variantId: item.variantId || null,
          batchId: item.batchId || null,
          currentQty: Number(item.currentQty),
          adjustedQty: diffQty,
          newQty: Number(item.newQty),
          calculatedUnitCost,
          costImpact: totalCostImpact,
        });
      }

      // 2. Create StockAdjustment header & lines
      const adjustment = await tx.stockAdjustment.create({
        data: {
          organizationId,
          adjustmentNumber: dto.adjustmentNumber,
          warehouseId: dto.warehouseId,
          reason: dto.reason,
          notes: dto.notes,
          createdById,
          items: {
            create: processedItems.map((pi) => ({
              locationId: pi.locationId,
              productId: pi.productId,
              variantId: pi.variantId,
              batchId: pi.batchId,
              currentQty: new Prisma.Decimal(pi.currentQty),
              adjustedQty: new Prisma.Decimal(pi.adjustedQty),
              newQty: new Prisma.Decimal(pi.newQty),
              unitCost: new Prisma.Decimal(pi.calculatedUnitCost),
            })),
          },
        },
        include: {
          warehouse: true,
          items: {
            include: {
              product: true,
              variant: true,
              location: true,
            },
          },
        },
      });

      // 3. Update Stock Levels, post Movements, and add Cost Layers for positive deltas
      for (const pi of processedItems) {
        if (pi.adjustedQty === 0) continue;

        const diffDecimal = new Prisma.Decimal(pi.adjustedQty);
        const costDecimal = new Prisma.Decimal(pi.calculatedUnitCost);
        const movementType = pi.adjustedQty > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";

        // Upsert StockLevel
        const stockLevel = await tx.stockLevel.findFirst({
          where: {
            organizationId,
            locationId: pi.locationId,
            productId: pi.productId,
            variantId: pi.variantId,
            batchId: pi.batchId,
          },
        });

        const currentOnHand = stockLevel ? stockLevel.onHand : new Prisma.Decimal(0);
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
              locationId: pi.locationId,
              productId: pi.productId,
              variantId: pi.variantId,
              batchId: pi.batchId,
              onHand: newOnHand,
              reserved: new Prisma.Decimal(0),
            },
          });
        }

        // Post immutable Movement ledger row
        await tx.stockMovement.create({
          data: {
            organizationId,
            warehouseId: dto.warehouseId,
            locationId: pi.locationId,
            productId: pi.productId,
            variantId: pi.variantId,
            batchId: pi.batchId,
            movementType,
            quantity: diffDecimal,
            unitCost: costDecimal,
            totalCost: new Prisma.Decimal(pi.costImpact),
            referenceType: "STOCK_ADJUSTMENT",
            referenceId: adjustment.id,
            actorId: createdById,
            notes: `Adjustment: ${dto.reason} (${valuationMethod} Valuation)`,
          },
        });

        // Create new Cost Layer if positive adjustment (stock gain)
        if (pi.adjustedQty > 0) {
          await tx.inventoryCostLayer.create({
            data: {
              organizationId,
              warehouseId: dto.warehouseId,
              locationId: pi.locationId,
              productId: pi.productId,
              variantId: pi.variantId,
              batchId: pi.batchId,
              initialQty: diffDecimal,
              remainingQty: diffDecimal,
              unitCost: costDecimal,
              status: "ACTIVE",
            },
          });
        }
      }

      // 4. Post GL Journal Entry for Inventory Adjustment
      let netAdjustmentCost = 0;
      for (const pi of processedItems) {
        netAdjustmentCost += pi.costImpact;
      }

      if (Math.abs(netAdjustmentCost) > 0.0001) {
        const inventoryAssetId =
          await this.journalEntriesService.getMappedAccountId(
            tx,
            organizationId,
            "INVENTORY_ASSET",
            "1030",
          );
        const adjustmentWriteoffId =
          await this.journalEntriesService.getMappedAccountId(
            tx,
            organizationId,
            "INVENTORY_ADJUSTMENT",
            "5020",
          );

        const lines =
          netAdjustmentCost > 0
            ? [
                { accountId: inventoryAssetId, debit: netAdjustmentCost, credit: 0 },
                { accountId: adjustmentWriteoffId, debit: 0, credit: netAdjustmentCost },
              ]
            : [
                {
                  accountId: adjustmentWriteoffId,
                  debit: Math.abs(netAdjustmentCost),
                  credit: 0,
                },
                {
                  accountId: inventoryAssetId,
                  debit: 0,
                  credit: Math.abs(netAdjustmentCost),
                },
              ];

        await this.journalEntriesService.postOperationalJournal(tx, {
          orgId: organizationId,
          userId: createdById,
          sourceModule: "INVENTORY",
          referenceType: "StockAdjustment",
          referenceId: adjustment.id,
          description: `Stock Adjustment: ${dto.reason} (${valuationMethod} Valuation)`,
          postingDate: new Date(),
          lines,
        });
      }

      return adjustment;
    });
  }
}

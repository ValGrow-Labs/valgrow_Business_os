import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, CycleCountStatus, StockMovementType } from "@prisma/client";
import { CreateCycleCountDto, CountItemInputDto } from "./dto/cycle-count.dto";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";

@Injectable()
export class CycleCountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  /**
   * Generates a unique cycle count number: CYC-YYYYMMDD-XXXX
   */
  private async generateCountNumber(organizationId: string): Promise<string> {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await this.prisma.cycleCount.count({
      where: { organizationId },
    });
    const seq = String(count + 1).padStart(4, "0");
    return `CYC-${todayStr}-${seq}`;
  }

  /**
   * Creates a new Cycle Count session and snapshots current system stock levels.
   */
  async create(organizationId: string, userId: string | null, dto: CreateCycleCountDto) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId },
    });
    if (!warehouse) {
      throw new NotFoundException("Warehouse not found in this organization");
    }

    const countNumber = await this.generateCountNumber(organizationId);

    // Snapshot all active StockLevels in this warehouse
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { organizationId, warehouseId: dto.warehouseId },
    });

    const itemsData = stockLevels.map((lvl) => ({
      productId: lvl.productId,
      variantId: lvl.variantId,
      locationId: lvl.locationId,
      batchId: lvl.batchId,
      systemQty: lvl.onHand,
      countedQty: null,
      variance: null,
    }));

    const cycleCount = await this.prisma.cycleCount.create({
      data: {
        organizationId,
        countNumber,
        warehouseId: dto.warehouseId,
        status: CycleCountStatus.COUNTING,
        countedById: userId,
        notes: dto.notes,
        startedAt: new Date(),
        items: {
          createMany: {
            data: itemsData,
          },
        },
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        countedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
    });

    if (userId) {
      await this.activityLogsService.logEvent(
        organizationId,
        userId,
        "CREATE_CYCLE_COUNT",
        "CycleCount",
        cycleCount.id,
        { countNumber, warehouseId: dto.warehouseId, totalItems: itemsData.length },
      );
    }

    return cycleCount;
  }

  /**
   * Returns list of cycle count sessions.
   */
  async findAll(organizationId: string, warehouseId?: string, status?: CycleCountStatus) {
    const where: Prisma.CycleCountWhereInput = { organizationId };
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;

    const counts = await this.prisma.cycleCount.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        countedBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          select: {
            id: true,
            systemQty: true,
            countedQty: true,
            variance: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return counts.map((cc) => {
      const items = cc.items;
      const totalItems = items.length;
      const countedItems = items.filter((i) => i.countedQty !== null).length;
      const varianceItems = items.filter((i) => i.variance !== null && Number(i.variance) !== 0).length;

      return {
        id: cc.id,
        countNumber: cc.countNumber,
        warehouseId: cc.warehouseId,
        warehouseName: cc.warehouse?.name || "-",
        status: cc.status,
        notes: cc.notes,
        countedBy: cc.countedBy
          ? `${cc.countedBy.firstName || ""} ${cc.countedBy.lastName || ""}`.trim()
          : null,
        startedAt: cc.startedAt,
        completedAt: cc.completedAt,
        createdAt: cc.createdAt,
        totalItems,
        countedItems,
        varianceItems,
      };
    });
  }

  /**
   * Returns cycle count session detail with item breakdown.
   */
  async findOne(id: string, organizationId: string) {
    const cc = await this.prisma.cycleCount.findFirst({
      where: { id, organizationId },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        countedBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, costPrice: true } },
            variant: { select: { id: true, name: true, sku: true } },
            location: { select: { id: true, name: true } },
            batch: { select: { id: true, batchNumber: true } },
          },
        },
      },
    });

    if (!cc) {
      throw new NotFoundException("Cycle count record not found in this organization");
    }

    const items = cc.items.map((item) => {
      const systemQty = Number(item.systemQty);
      const countedQty = item.countedQty !== null ? Number(item.countedQty) : null;
      const variance = item.variance !== null ? Number(item.variance) : null;
      const unitCost = Number(item.product?.costPrice || 0);
      const varianceValue = variance !== null ? variance * unitCost : null;

      return {
        id: item.id,
        locationId: item.locationId,
        locationName: item.location?.name || "General Bin",
        productId: item.productId,
        productName: item.product?.name || "Unassigned",
        productSku: item.product?.sku || "-",
        variantName: item.variant?.name || "Base Product",
        batchNumber: item.batch?.batchNumber || "N/A",
        systemQty,
        countedQty,
        variance,
        unitCost,
        varianceValue,
        notes: item.notes,
      };
    });

    return {
      id: cc.id,
      countNumber: cc.countNumber,
      warehouseId: cc.warehouseId,
      warehouseName: cc.warehouse?.name || "-",
      status: cc.status,
      notes: cc.notes,
      countedBy: cc.countedBy
        ? `${cc.countedBy.firstName || ""} ${cc.countedBy.lastName || ""}`.trim()
        : null,
      startedAt: cc.startedAt,
      completedAt: cc.completedAt,
      createdAt: cc.createdAt,
      items,
    };
  }

  /**
   * Submits physical counted quantities for items in a session.
   */
  async updateItemCounts(
    id: string,
    organizationId: string,
    items: CountItemInputDto[],
  ) {
    const cc = await this.prisma.cycleCount.findFirst({
      where: { id, organizationId },
    });
    if (!cc) {
      throw new NotFoundException("Cycle count record not found");
    }

    if (cc.status === CycleCountStatus.POSTED) {
      throw new BadRequestException("Cannot edit items in a posted cycle count");
    }

    await this.prisma.$transaction(
      items.map((item) => {
        const counted = Math.max(0, Number(item.countedQty));
        return this.prisma.cycleCountItem.update({
          where: { id: item.itemId },
          data: {
            countedQty: new Prisma.Decimal(counted),
            variance: new Prisma.Decimal(counted - Number(item.countedQty)), // Will re-evaluate variance below
            notes: item.notes,
          },
        });
      }),
    );

    // Re-evaluate variance = countedQty - systemQty for all items in the session
    const currentItems = await this.prisma.cycleCountItem.findMany({
      where: { cycleCountId: id },
    });

    for (const item of currentItems) {
      if (item.countedQty !== null) {
        const sys = Number(item.systemQty);
        const cnt = Number(item.countedQty);
        const diff = cnt - sys;
        await this.prisma.cycleCountItem.update({
          where: { id: item.id },
          data: { variance: new Prisma.Decimal(diff) },
        });
      }
    }

    // Check if all items counted -> update status to COMPLETED
    const totalCount = currentItems.length;
    const countedCount = currentItems.filter((i) => i.countedQty !== null).length;
    if (totalCount > 0 && countedCount === totalCount && cc.status === CycleCountStatus.COUNTING) {
      await this.prisma.cycleCount.update({
        where: { id },
        data: { status: CycleCountStatus.COMPLETED, completedAt: new Date() },
      });
    }

    return this.findOne(id, organizationId);
  }

  /**
   * Posts cycle count variances as stock ledger adjustments.
   */
  async postVariances(id: string, organizationId: string, userId: string | null) {
    const cc = await this.prisma.cycleCount.findFirst({
      where: { id, organizationId },
      include: {
        items: {
          include: {
            product: { select: { costPrice: true } },
          },
        },
      },
    });

    if (!cc) {
      throw new NotFoundException("Cycle count record not found");
    }

    if (cc.status === CycleCountStatus.POSTED) {
      throw new BadRequestException("Cycle count session has already been posted");
    }

    const itemsWithVariance = cc.items.filter(
      (item) => item.variance !== null && Number(item.variance) !== 0,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const item of itemsWithVariance) {
        const diff = Number(item.variance);
        const unitCost = Number(item.product?.costPrice || 0);

        // Find or fallback to warehouse default location
        let locationId = item.locationId;
        if (!locationId) {
          const loc = await tx.location.findFirst({
            where: { warehouseId: cc.warehouseId, organizationId },
          });
          locationId = loc?.id || null;
        }

        if (locationId) {
          // 1. Create StockMovement
          await tx.stockMovement.create({
            data: {
              organizationId,
              warehouseId: cc.warehouseId,
              locationId,
              productId: item.productId,
              variantId: item.variantId,
              batchId: item.batchId,
              movementType: StockMovementType.STOCK_COUNT_CORRECTION,
              quantity: new Prisma.Decimal(diff),
              unitCost: new Prisma.Decimal(unitCost),
              totalCost: new Prisma.Decimal(diff * unitCost),
              referenceType: "CYCLE_COUNT",
              referenceId: cc.countNumber,
              actorId: userId || undefined,
            },
          });
        }

        // 2. Update StockLevel
        const stockLevel = await tx.stockLevel.findFirst({
          where: {
            organizationId,
            warehouseId: cc.warehouseId,
            productId: item.productId,
            variantId: item.variantId || undefined,
            locationId: item.locationId || undefined,
            batchId: item.batchId || undefined,
          },
        });

        if (stockLevel) {
          await tx.stockLevel.update({
            where: { id: stockLevel.id },
            data: {
              onHand: { increment: diff },
            },
          });
        }
      }

      // Mark session as POSTED
      await tx.cycleCount.update({
        where: { id },
        data: {
          status: CycleCountStatus.POSTED,
          completedAt: cc.completedAt || new Date(),
        },
      });
    });

    if (userId) {
      await this.activityLogsService.logEvent(
        organizationId,
        userId,
        "POST_CYCLE_COUNT_VARIANCES",
        "CycleCount",
        id,
        { countNumber: cc.countNumber, postedVariancesCount: itemsWithVariance.length },
      );
    }

    return this.findOne(id, organizationId);
  }
}

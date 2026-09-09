import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ActivityLogsService } from "../modules/activity-logs/activity-logs.service";

@Injectable()
export class ReorderCheckTask implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReorderCheckTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  onApplicationBootstrap() {
    // Schedule periodic reorder check every 6 hours
    setInterval(() => {
      this.checkReorderLevels().catch((err) =>
        this.logger.error(`Error in scheduled reorder check: ${err.message}`),
      );
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Evaluates inventory reorder thresholds across all organizations.
   */
  async checkReorderLevels() {
    this.logger.log("Starting scheduled inventory reorder level check...");

    const orgs = await this.prisma.organization.findMany({ select: { id: true, name: true } });

    for (const org of orgs) {
      try {
        const stockLevels = await this.prisma.stockLevel.findMany({
          where: {
            organizationId: org.id,
            reorderLevel: { not: null },
          },
          include: {
            product: { select: { name: true, sku: true } },
            warehouse: { select: { name: true } },
          },
        });

        const lowStockItems = stockLevels.filter((lvl) => {
          const available = Number(lvl.onHand) - Number(lvl.reserved);
          const reorderLvl = lvl.reorderLevel !== null ? Number(lvl.reorderLevel) : 0;
          return available <= reorderLvl;
        });

        if (lowStockItems.length > 0) {
          this.logger.warn(
            `Organization ${org.name} (${org.id}) has ${lowStockItems.length} products below reorder level.`,
          );

          await this.activityLogsService.logEvent(
            org.id,
            null,
            "INVENTORY_REORDER_LEVEL_ALERT",
            "InventoryStock",
            "CRON",
            {
              lowStockCount: lowStockItems.length,
              items: lowStockItems.map((item) => ({
                product: item.product?.name,
                sku: item.product?.sku,
                warehouse: item.warehouse?.name,
                onHand: Number(item.onHand),
                reserved: Number(item.reserved),
                reorderLevel: Number(item.reorderLevel),
              })),
            },
          );
        }
      } catch (err) {
        this.logger.error(`Failed to process reorder check for org ${org.id}: ${err.message}`);
      }
    }

    this.logger.log("Finished scheduled inventory reorder level check.");
  }
}

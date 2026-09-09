import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ActivityLogsService } from "../modules/activity-logs/activity-logs.service";

@Injectable()
export class BatchExpiryTask implements OnApplicationBootstrap {
  private readonly logger = new Logger(BatchExpiryTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  onApplicationBootstrap() {
    // Schedule periodic batch expiry check every 12 hours
    setInterval(() => {
      this.checkExpiringBatches().catch((err) =>
        this.logger.error(`Error in scheduled batch expiry check: ${err.message}`),
      );
    }, 12 * 60 * 60 * 1000);
  }

  /**
   * Evaluates inventory batches expiring within 30 days across all organizations.
   */
  async checkExpiringBatches() {
    this.logger.log("Starting scheduled batch expiry check...");

    const orgs = await this.prisma.organization.findMany({ select: { id: true, name: true } });
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);

    for (const org of orgs) {
      try {
        const expiringBatches = await this.prisma.inventoryBatch.findMany({
          where: {
            organizationId: org.id,
            expiryDate: { gte: now, lte: soon },
          },
          include: {
            product: { select: { name: true, sku: true } },
            stockLevels: { select: { onHand: true } },
          },
        });

        const activeExpiring = expiringBatches.filter((b) =>
          b.stockLevels.some((sl) => Number(sl.onHand) > 0),
        );

        if (activeExpiring.length > 0) {
          this.logger.warn(
            `Organization ${org.name} (${org.id}) has ${activeExpiring.length} active batches expiring in 30 days.`,
          );

          await this.activityLogsService.logEvent(
            org.id,
            null,
            "BATCH_EXPIRY_WARNING",
            "InventoryBatch",
            "CRON",
            {
              expiringBatchesCount: activeExpiring.length,
              batches: activeExpiring.map((b) => ({
                batchNumber: b.batchNumber,
                product: b.product?.name,
                sku: b.product?.sku,
                expiryDate: b.expiryDate,
              })),
            },
          );
        }
      } catch (err) {
        this.logger.error(`Failed to process batch expiry check for org ${org.id}: ${err.message}`);
      }
    }

    this.logger.log("Finished scheduled batch expiry check.");
  }
}

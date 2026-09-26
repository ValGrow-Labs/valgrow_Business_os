import { Module } from "@nestjs/common";
import { InventoryAdjustmentsService } from "./inventory-adjustments.service";
import { InventoryAdjustmentsController } from "./inventory-adjustments.controller";
import { InventoryModule } from "../inventory/inventory.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";

@Module({
  imports: [PrismaModule, InventoryModule, JournalEntriesModule, ActivityLogsModule],
  controllers: [InventoryAdjustmentsController],
  providers: [InventoryAdjustmentsService],
  exports: [InventoryAdjustmentsService],
})
export class InventoryAdjustmentsModule {}


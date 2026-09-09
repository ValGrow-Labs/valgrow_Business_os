import { Module } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { StockValuationService } from "./stock-valuation.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [InventoryController],
  providers: [InventoryService, StockValuationService],
  exports: [InventoryService, StockValuationService],
})
export class InventoryModule {}


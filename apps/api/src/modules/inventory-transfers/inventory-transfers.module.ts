import { Module } from "@nestjs/common";
import { InventoryTransfersService } from "./inventory-transfers.service";
import { InventoryTransfersController } from "./inventory-transfers.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [InventoryTransfersController],
  providers: [InventoryTransfersService],
  exports: [InventoryTransfersService],
})
export class InventoryTransfersModule {}

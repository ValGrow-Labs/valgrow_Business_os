import { Module } from "@nestjs/common";
import { InventoryBatchesService } from "./inventory-batches.service";
import { InventoryBatchesController } from "./inventory-batches.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [InventoryBatchesController],
  providers: [InventoryBatchesService],
  exports: [InventoryBatchesService],
})
export class InventoryBatchesModule {}

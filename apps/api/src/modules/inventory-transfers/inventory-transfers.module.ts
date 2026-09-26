import { Module } from "@nestjs/common";
import { InventoryTransfersService } from "./inventory-transfers.service";
import { InventoryTransfersController } from "./inventory-transfers.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [InventoryTransfersController],
  providers: [InventoryTransfersService],
  exports: [InventoryTransfersService],
})
export class InventoryTransfersModule {}

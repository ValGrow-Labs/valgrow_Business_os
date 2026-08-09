import { Module } from "@nestjs/common";
import { InventoryMovementsService } from "./inventory-movements.service";
import { InventoryMovementsController } from "./inventory-movements.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [InventoryMovementsController],
  providers: [InventoryMovementsService],
  exports: [InventoryMovementsService],
})
export class InventoryMovementsModule {}

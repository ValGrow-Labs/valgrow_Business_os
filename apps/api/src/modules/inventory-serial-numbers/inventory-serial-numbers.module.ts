import { Module } from "@nestjs/common";
import { InventorySerialNumbersService } from "./inventory-serial-numbers.service";
import { InventorySerialNumbersController } from "./inventory-serial-numbers.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [InventorySerialNumbersController],
  providers: [InventorySerialNumbersService],
  exports: [InventorySerialNumbersService],
})
export class InventorySerialNumbersModule {}

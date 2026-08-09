import { Module } from "@nestjs/common";
import { InventoryReservationsService } from "./inventory-reservations.service";
import { InventoryReservationsController } from "./inventory-reservations.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [InventoryReservationsController],
  providers: [InventoryReservationsService],
  exports: [InventoryReservationsService],
})
export class InventoryReservationsModule {}

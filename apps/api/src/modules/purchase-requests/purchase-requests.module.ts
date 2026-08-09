import { Module } from "@nestjs/common";
import { PurchaseRequestsService } from "./purchase-requests.service";
import { PurchaseRequestsController } from "./purchase-requests.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService],
  exports: [PurchaseRequestsService],
})
export class PurchaseRequestsModule {}

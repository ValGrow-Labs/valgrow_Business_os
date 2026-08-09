import { Module } from "@nestjs/common";
import { ProductPricesService } from "./product-prices.service";
import { ProductPricesController } from "./product-prices.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ProductPricesController],
  providers: [ProductPricesService],
  exports: [ProductPricesService],
})
export class ProductPricesModule {}

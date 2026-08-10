import { Module } from "@nestjs/common";
import { TaxAccountingService } from "./tax-accounting.service";
import { TaxAccountingController } from "./tax-accounting.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [TaxAccountingController],
  providers: [TaxAccountingService],
  exports: [TaxAccountingService],
})
export class TaxAccountingModule {}

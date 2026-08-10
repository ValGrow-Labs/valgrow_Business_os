import { Module } from "@nestjs/common";
import { AccountingPeriodsService } from "./accounting-periods.service";
import { AccountingPeriodsController } from "./accounting-periods.controller";

@Module({
  controllers: [AccountingPeriodsController],
  providers: [AccountingPeriodsService],
  exports: [AccountingPeriodsService],
})
export class AccountingPeriodsModule {}

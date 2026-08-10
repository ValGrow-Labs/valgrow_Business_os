import { Module } from "@nestjs/common";
import { BankAccountingService } from "./bank-accounting.service";
import { BankAccountingController } from "./bank-accounting.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BankAccountingController],
  providers: [BankAccountingService],
  exports: [BankAccountingService],
})
export class BankAccountingModule {}

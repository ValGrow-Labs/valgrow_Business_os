import { Module } from "@nestjs/common";
import { ArSubLedgerService } from "./ar-subledger.service";
import { ArSubLedgerController } from "./ar-subledger.controller";
import { ApSubLedgerService } from "./ap-subledger.service";
import { ApSubLedgerController } from "./ap-subledger.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ArSubLedgerController, ApSubLedgerController],
  providers: [ArSubLedgerService, ApSubLedgerService],
  exports: [ArSubLedgerService, ApSubLedgerService],
})
export class ArApModule {}

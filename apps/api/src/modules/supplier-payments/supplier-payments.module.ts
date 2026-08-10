import { Module } from "@nestjs/common";
import { SupplierPaymentsService } from "./supplier-payments.service";
import { SupplierPaymentsController } from "./supplier-payments.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";

@Module({
  imports: [PrismaModule, JournalEntriesModule],
  controllers: [SupplierPaymentsController],
  providers: [SupplierPaymentsService],
  exports: [SupplierPaymentsService],
})
export class SupplierPaymentsModule {}

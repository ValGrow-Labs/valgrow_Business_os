import { Module } from "@nestjs/common";
import { CustomerPaymentsService } from "./customer-payments.service";
import { CustomerPaymentsController } from "./customer-payments.controller";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";

@Module({
  imports: [JournalEntriesModule],
  controllers: [CustomerPaymentsController],
  providers: [CustomerPaymentsService],
  exports: [CustomerPaymentsService],
})
export class CustomerPaymentsModule {}

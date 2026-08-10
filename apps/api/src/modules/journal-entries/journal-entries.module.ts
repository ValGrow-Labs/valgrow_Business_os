import { Module } from "@nestjs/common";
import { JournalEntriesService } from "./journal-entries.service";
import { JournalEntriesController } from "./journal-entries.controller";
import { AccountingPeriodsModule } from "../accounting-periods/accounting-periods.module";

@Module({
  imports: [AccountingPeriodsModule],
  controllers: [JournalEntriesController],
  providers: [JournalEntriesService],
  exports: [JournalEntriesService],
})
export class JournalEntriesModule {}

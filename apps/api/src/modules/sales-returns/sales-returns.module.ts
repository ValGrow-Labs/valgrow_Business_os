import { Module } from "@nestjs/common";
import { SalesReturnsService } from "./sales-returns.service";
import { SalesReturnsController } from "./sales-returns.controller";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";

@Module({
  imports: [JournalEntriesModule],
  controllers: [SalesReturnsController],
  providers: [SalesReturnsService],
  exports: [SalesReturnsService],
})
export class SalesReturnsModule {}

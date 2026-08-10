import { Module } from "@nestjs/common";
import { SalesCreditNotesService } from "./sales-credit-notes.service";
import { SalesCreditNotesController } from "./sales-credit-notes.controller";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";

@Module({
  imports: [JournalEntriesModule],
  controllers: [SalesCreditNotesController],
  providers: [SalesCreditNotesService],
  exports: [SalesCreditNotesService],
})
export class SalesCreditNotesModule {}

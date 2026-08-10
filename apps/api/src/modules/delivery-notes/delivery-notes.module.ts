import { Module } from "@nestjs/common";
import { DeliveryNotesService } from "./delivery-notes.service";
import { DeliveryNotesController } from "./delivery-notes.controller";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";

@Module({
  imports: [JournalEntriesModule],
  controllers: [DeliveryNotesController],
  providers: [DeliveryNotesService],
  exports: [DeliveryNotesService],
})
export class DeliveryNotesModule {}

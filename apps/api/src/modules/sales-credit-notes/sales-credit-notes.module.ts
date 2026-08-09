import { Module } from "@nestjs/common";
import { SalesCreditNotesService } from "./sales-credit-notes.service";
import { SalesCreditNotesController } from "./sales-credit-notes.controller";

@Module({
  controllers: [SalesCreditNotesController],
  providers: [SalesCreditNotesService],
  exports: [SalesCreditNotesService],
})
export class SalesCreditNotesModule {}

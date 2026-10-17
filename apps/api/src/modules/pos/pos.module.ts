import { Module } from "@nestjs/common";
import { PosController } from "./pos.controller";
import { PosSessionService } from "./services/pos-session.service";
import { PosProductSearchService } from "./services/pos-product-search.service";
import { PosCartService } from "./services/pos-cart.service";
import { PosCheckoutService } from "./services/pos-checkout.service";
import { PosRefundService } from "./services/pos-refund.service";
import { PosWorkflowService } from "./services/pos-workflow.service";
import { SalesReturnsModule } from "../sales-returns/sales-returns.module";
import { JournalEntriesModule } from "../journal-entries/journal-entries.module";
import { DocumentsModule } from "../documents/documents.module";

@Module({
  imports: [SalesReturnsModule, JournalEntriesModule, DocumentsModule],
  controllers: [PosController],
  providers: [
    PosSessionService,
    PosProductSearchService,
    PosCartService,
    PosCheckoutService,
    PosRefundService,
    PosWorkflowService,
  ],
  exports: [
    PosSessionService,
    PosProductSearchService,
    PosCartService,
    PosCheckoutService,
    PosRefundService,
    PosWorkflowService,
  ],
})
export class PosModule {}

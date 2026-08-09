import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { SalesCreditNotesService } from "./sales-credit-notes.service";
import {
  CreateSalesCreditNoteDto,
  UpdateSalesCreditNoteDto,
} from "./dto/create-sales-credit-note.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("sales-credit-notes")
export class SalesCreditNotesController {
  constructor(
    private readonly salesCreditNotesService: SalesCreditNotesService,
  ) {}

  @Get()
  @RequirePermissions("sales.read")
  getSalesCreditNotes(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.salesCreditNotesService.getSalesCreditNotes(
      organizationId,
      status,
    );
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  getSalesCreditNoteById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.salesCreditNotesService.getSalesCreditNoteById(
      id,
      organizationId,
    );
  }

  @Post()
  @RequirePermissions("sales.invoice", "sales.create")
  createSalesCreditNote(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateSalesCreditNoteDto,
  ) {
    return this.salesCreditNotesService.createSalesCreditNote(
      organizationId,
      dto,
    );
  }

  @Patch(":id")
  @RequirePermissions("sales.update")
  updateSalesCreditNote(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateSalesCreditNoteDto,
  ) {
    return this.salesCreditNotesService.updateSalesCreditNote(
      id,
      organizationId,
      dto,
    );
  }

  @Post(":id/issue")
  @RequirePermissions("sales.update")
  issue(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.salesCreditNotesService.issue(id, organizationId, userId);
  }

  @Post(":id/apply")
  @RequirePermissions("sales.update")
  apply(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.salesCreditNotesService.apply(id, organizationId, userId);
  }

  @Post(":id/cancel")
  @RequirePermissions("sales.update")
  cancel(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.salesCreditNotesService.cancel(id, organizationId, userId);
  }
}

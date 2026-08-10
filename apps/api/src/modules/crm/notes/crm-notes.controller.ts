import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { CrmNotesService } from "./crm-notes.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/notes")
export class CrmNotesController {
  constructor(private readonly notesService: CrmNotesService) {}

  @Get()
  @RequirePermissions("crm.read")
  getNotes(
    @CurrentOrg("id") organizationId: string,
    @Query("customerId") customerId?: string,
    @Query("leadId") leadId?: string,
    @Query("opportunityId") opportunityId?: string,
  ) {
    return this.notesService.getNotes(organizationId, {
      customerId,
      leadId,
      opportunityId,
    });
  }

  @Post()
  @RequirePermissions("crm.create")
  createNote(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") authorId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.createNote(organizationId, authorId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.delete")
  deleteNote(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.notesService.deleteNote(id, organizationId);
  }
}

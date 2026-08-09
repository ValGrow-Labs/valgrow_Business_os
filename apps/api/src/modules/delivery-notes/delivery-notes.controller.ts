import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { DeliveryNotesService } from "./delivery-notes.service";
import { CreateDeliveryNoteDto } from "./dto/create-delivery-note.dto";
import { DeliveryNoteActionDto } from "./dto/delivery-note-action.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("delivery-notes")
export class DeliveryNotesController {
  constructor(private readonly deliveryNotesService: DeliveryNotesService) {}

  @Get()
  @RequirePermissions("sales.read")
  getDeliveryNotes(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.deliveryNotesService.getDeliveryNotes(organizationId, status);
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  getDeliveryNoteById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.deliveryNotesService.getDeliveryNoteById(id, organizationId);
  }

  @Post()
  @RequirePermissions("sales.deliver", "sales.create")
  createDeliveryNote(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateDeliveryNoteDto,
  ) {
    return this.deliveryNotesService.createDeliveryNote(organizationId, dto);
  }

  @Post(":id/post")
  @RequirePermissions("sales.deliver")
  postDeliveryNote(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.deliveryNotesService.postDeliveryNote(
      id,
      organizationId,
      userId,
    );
  }

  @Post(":id/cancel")
  @RequirePermissions("sales.deliver")
  cancelDeliveryNote(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.deliveryNotesService.cancelDeliveryNote(
      id,
      organizationId,
      userId,
    );
  }
}

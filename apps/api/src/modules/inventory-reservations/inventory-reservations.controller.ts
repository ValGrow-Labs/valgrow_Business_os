import { Controller, Get, Post, Param, Body, Query } from "@nestjs/common";
import { InventoryReservationsService } from "./inventory-reservations.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateReservationDto } from "./dto/create-reservation.dto";

@Controller("inventory/reservations")
export class InventoryReservationsController {
  constructor(
    private readonly reservationsService: InventoryReservationsService,
  ) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getReservations(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.reservationsService.getReservations(organizationId, status);
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async getReservation(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.reservationsService.getReservationById(id, organizationId);
  }

  @RequirePermissions("inventory.reserve")
  @Post()
  async createReservation(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createReservation(organizationId, dto);
  }

  @RequirePermissions("inventory.reserve")
  @Post(":id/fulfill")
  async fulfillReservation(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.reservationsService.fulfillReservation(id, organizationId);
  }

  @RequirePermissions("inventory.reserve")
  @Post(":id/cancel")
  async cancelReservation(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.reservationsService.cancelReservation(id, organizationId);
  }
}

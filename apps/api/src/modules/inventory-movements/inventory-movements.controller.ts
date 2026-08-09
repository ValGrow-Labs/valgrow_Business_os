import { Controller, Get, Post, Param, Body, Query } from "@nestjs/common";
import { InventoryMovementsService } from "./inventory-movements.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateMovementDto } from "./dto/create-movement.dto";

@Controller("inventory/movements")
export class InventoryMovementsController {
  constructor(private readonly movementsService: InventoryMovementsService) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getMovements(
    @CurrentOrg("id") organizationId: string,
    @Query("locationId") locationId?: string,
    @Query("productId") productId?: string,
    @Query("variantId") variantId?: string,
    @Query("movementType") movementType?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.movementsService.getMovements(organizationId, {
      locationId,
      productId,
      variantId,
      movementType,
      page,
      limit,
    });
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async getMovement(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.movementsService.getMovementById(id, organizationId);
  }

  @RequirePermissions("inventory.create")
  @Post()
  async createMovement(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.movementsService.createMovement(organizationId, actorId, dto);
  }
}

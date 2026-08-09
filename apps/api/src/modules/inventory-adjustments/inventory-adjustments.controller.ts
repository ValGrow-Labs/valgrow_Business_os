import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { InventoryAdjustmentsService } from "./inventory-adjustments.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";

@Controller("inventory/adjustments")
export class InventoryAdjustmentsController {
  constructor(
    private readonly adjustmentsService: InventoryAdjustmentsService,
  ) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getAdjustments(@CurrentOrg("id") organizationId: string) {
    return this.adjustmentsService.getAdjustments(organizationId);
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async getAdjustment(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.adjustmentsService.getAdjustmentById(id, organizationId);
  }

  @RequirePermissions("inventory.adjust")
  @Post()
  async createAdjustment(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") createdById: string,
    @Body() dto: CreateAdjustmentDto,
  ) {
    return this.adjustmentsService.createAdjustment(
      organizationId,
      createdById,
      dto,
    );
  }
}

import { Controller, Get, Post, Param, Body, Query } from "@nestjs/common";
import { InventoryAdjustmentsService } from "./inventory-adjustments.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";

@Controller("inventory/adjustments")
export class InventoryAdjustmentsController {
  constructor(
    private readonly adjustmentsService: InventoryAdjustmentsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getAdjustments(
    @CurrentOrg("id") organizationId: string,
    @Query("search") search?: string,
    @Query("reason") reason?: string,
    @Query("warehouseId") warehouseId?: string,
  ) {
    return this.adjustmentsService.getAdjustments(
      organizationId,
      search,
      reason,
      warehouseId,
    );
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
    const adjustment = await this.adjustmentsService.createAdjustment(
      organizationId,
      createdById,
      dto,
    );

    // Audit log posting
    await this.activityLogsService.logEvent(
      organizationId,
      createdById || null,
      "CREATE_ADJUSTMENT",
      "StockAdjustment",
      adjustment.id,
      {
        adjustmentNumber: adjustment.adjustmentNumber,
        warehouseId: adjustment.warehouseId,
        reason: adjustment.reason,
        itemCount: adjustment.items?.length || 0,
      },
    );

    return adjustment;
  }
}

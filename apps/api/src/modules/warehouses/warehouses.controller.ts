import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { WarehousesService } from "./warehouses.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";

@Controller("warehouses")
export class WarehousesController {
  constructor(
    private readonly warehousesService: WarehousesService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getWarehouses(
    @CurrentOrg("id") organizationId: string,
    @Query("branchId") branchId?: string,
    @Query("status") status?: string,
  ) {
    return this.warehousesService.getWarehouses(organizationId, branchId, status);
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async getWarehouse(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.warehousesService.getWarehouseById(id, organizationId);
  }

  @RequirePermissions("inventory.create")
  @Post()
  async createWarehouse(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateWarehouseDto,
  ) {
    const warehouse = await this.warehousesService.createWarehouse(organizationId, dto);

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "CREATE_WAREHOUSE",
      "Warehouse",
      warehouse.id,
      { code: warehouse.code, name: warehouse.name, branchId: warehouse.branchId },
    );

    return warehouse;
  }

  @RequirePermissions("inventory.update")
  @Patch(":id")
  async updateWarehouse(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const updated = await this.warehousesService.updateWarehouse(id, organizationId, dto);

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      dto.status === "INACTIVE" ? "DEACTIVATE_WAREHOUSE" : "UPDATE_WAREHOUSE",
      "Warehouse",
      id,
      { dto },
    );

    return updated;
  }

  @RequirePermissions("inventory.delete")
  @Delete(":id")
  async deleteWarehouse(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    const result = await this.warehousesService.deleteWarehouse(id, organizationId);

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "DELETE_WAREHOUSE",
      "Warehouse",
      id,
    );

    return result;
  }
}


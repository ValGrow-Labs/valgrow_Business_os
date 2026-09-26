import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { WarehousesService } from "./warehouses.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";

@Controller("warehouses")
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getWarehouses(@CurrentOrg("id") organizationId: string) {
    return this.warehousesService.getWarehouses(organizationId);
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
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.warehousesService.createWarehouse(organizationId, dto);
  }

  @RequirePermissions("inventory.update")
  @Patch(":id")
  async updateWarehouse(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.updateWarehouse(id, organizationId, dto);
  }

  @RequirePermissions("inventory.delete")
  @Delete(":id")
  async deleteWarehouse(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.warehousesService.deleteWarehouse(id, organizationId);
  }
}

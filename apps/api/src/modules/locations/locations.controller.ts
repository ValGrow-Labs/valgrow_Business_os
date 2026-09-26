import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { LocationsService } from "./locations.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Controller("warehouses/:warehouseId/locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getLocations(
    @Param("warehouseId") warehouseId: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.locationsService.getLocations(warehouseId, organizationId);
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async getLocation(
    @Param("warehouseId") warehouseId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.locationsService.getLocationById(
      id,
      warehouseId,
      organizationId,
    );
  }

  @RequirePermissions("inventory.create")
  @Post()
  async createLocation(
    @Param("warehouseId") warehouseId: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.locationsService.createLocation(
      warehouseId,
      organizationId,
      dto,
    );
  }

  @RequirePermissions("inventory.update")
  @Patch(":id")
  async updateLocation(
    @Param("warehouseId") warehouseId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.updateLocation(
      id,
      warehouseId,
      organizationId,
      dto,
    );
  }

  @RequirePermissions("inventory.delete")
  @Delete(":id")
  async deleteLocation(
    @Param("warehouseId") warehouseId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.locationsService.deleteLocation(
      id,
      warehouseId,
      organizationId,
    );
  }
}

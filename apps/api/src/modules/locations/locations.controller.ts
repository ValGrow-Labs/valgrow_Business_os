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
import { LocationsService } from "./locations.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Controller()
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @RequirePermissions("inventory.read")
  @Get("locations")
  async getAllLocations(
    @CurrentOrg("id") organizationId: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("status") status?: string,
  ) {
    return this.locationsService.getAllLocations(organizationId, warehouseId, status);
  }

  @RequirePermissions("inventory.read")
  @Get("warehouses/:warehouseId/locations")
  async getLocations(
    @Param("warehouseId") warehouseId: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.locationsService.getLocations(warehouseId, organizationId);
  }

  @RequirePermissions("inventory.read")
  @Get("warehouses/:warehouseId/locations/:id")
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
  @Post("warehouses/:warehouseId/locations")
  async createLocation(
    @Param("warehouseId") warehouseId: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateLocationDto,
  ) {
    const location = await this.locationsService.createLocation(
      warehouseId,
      organizationId,
      dto,
    );

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "CREATE_LOCATION",
      "Location",
      location.id,
      { code: location.code, name: location.name, warehouseId },
    );

    return location;
  }

  @RequirePermissions("inventory.update")
  @Patch("warehouses/:warehouseId/locations/:id")
  async updateLocation(
    @Param("warehouseId") warehouseId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    const updated = await this.locationsService.updateLocation(
      id,
      warehouseId,
      organizationId,
      dto,
    );

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      dto.status === "INACTIVE" ? "DEACTIVATE_LOCATION" : "UPDATE_LOCATION",
      "Location",
      id,
      { dto },
    );

    return updated;
  }

  @RequirePermissions("inventory.delete")
  @Delete("warehouses/:warehouseId/locations/:id")
  async deleteLocation(
    @Param("warehouseId") warehouseId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    const result = await this.locationsService.deleteLocation(
      id,
      warehouseId,
      organizationId,
    );

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "DELETE_LOCATION",
      "Location",
      id,
    );

    return result;
  }
}


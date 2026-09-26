import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { InventorySerialNumbersService } from "./inventory-serial-numbers.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateSerialDto } from "./dto/create-serial.dto";
import { UpdateSerialDto } from "./dto/update-serial.dto";

@Controller("inventory/serial-numbers")
export class InventorySerialNumbersController {
  constructor(
    private readonly serialService: InventorySerialNumbersService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getSerialNumbers(
    @CurrentOrg("id") organizationId: string,
    @Query("productId") productId?: string,
    @Query("status") status?: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("locationId") locationId?: string,
    @Query("search") search?: string,
  ) {
    return this.serialService.getSerialNumbers(organizationId, {
      productId,
      status,
      warehouseId,
      locationId,
      search,
    });
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async getSerial(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.serialService.getSerialById(id, organizationId);
  }

  @RequirePermissions("inventory.create")
  @Post()
  async createSerial(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateSerialDto,
  ) {
    const serial = await this.serialService.createSerial(organizationId, dto);

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "CREATE_SERIAL",
      "InventorySerialNumber",
      serial.id,
      { serialNumber: serial.serialNumber, productId: serial.productId },
    );

    return serial;
  }

  @RequirePermissions("inventory.update")
  @Patch(":id")
  async updateSerial(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateSerialDto,
  ) {
    const serial = await this.serialService.updateSerial(id, organizationId, dto);

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "UPDATE_SERIAL",
      "InventorySerialNumber",
      id,
      { dto },
    );

    return serial;
  }
}

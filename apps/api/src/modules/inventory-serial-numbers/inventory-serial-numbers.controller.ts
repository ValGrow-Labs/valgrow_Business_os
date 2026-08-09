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
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateSerialDto } from "./dto/create-serial.dto";
import { UpdateSerialDto } from "./dto/update-serial.dto";

@Controller("inventory/serial-numbers")
export class InventorySerialNumbersController {
  constructor(private readonly serialService: InventorySerialNumbersService) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getSerialNumbers(
    @CurrentOrg("id") organizationId: string,
    @Query("productId") productId?: string,
    @Query("status") status?: string,
  ) {
    return this.serialService.getSerialNumbers(
      organizationId,
      productId,
      status,
    );
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
    @Body() dto: CreateSerialDto,
  ) {
    return this.serialService.createSerial(organizationId, dto);
  }

  @RequirePermissions("inventory.update")
  @Patch(":id")
  async updateSerial(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateSerialDto,
  ) {
    return this.serialService.updateSerial(id, organizationId, dto);
  }
}

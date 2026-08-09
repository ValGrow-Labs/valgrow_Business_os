import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { UnitsService } from "./units.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  async getUnits(@CurrentOrg("id") organizationId: string) {
    return this.unitsService.getUnits(organizationId);
  }

  @Get(":id")
  async getUnit(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.unitsService.getUnitById(id, organizationId);
  }

  @RequirePermissions("settings.manage")
  @Post()
  async createUnit(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.unitsService.createUnit(organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Patch(":id")
  async updateUnit(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitsService.updateUnit(id, organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Delete(":id")
  async deleteUnit(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.unitsService.deleteUnit(id, organizationId);
  }
}

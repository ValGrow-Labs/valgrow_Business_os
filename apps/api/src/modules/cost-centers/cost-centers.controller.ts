import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { CostCentersService } from "./cost-centers.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateCostCenterDto } from "./dto/create-cost-center.dto";
import { UpdateCostCenterDto } from "./dto/update-cost-center.dto";

@Controller("cost-centers")
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}

  @RequirePermissions("accounting.read")
  @Get()
  getCostCenters(@CurrentOrg("id") orgId: string) {
    return this.costCentersService.getCostCenters(orgId);
  }

  @RequirePermissions("accounting.read")
  @Get(":id")
  getCostCenter(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.costCentersService.getCostCenter(id, orgId);
  }

  @RequirePermissions("accounting.manage_accounts")
  @Post()
  createCostCenter(
    @CurrentOrg("id") orgId: string,
    @Body() dto: CreateCostCenterDto,
  ) {
    return this.costCentersService.createCostCenter(orgId, dto);
  }

  @RequirePermissions("accounting.manage_accounts")
  @Patch(":id")
  updateCostCenter(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdateCostCenterDto,
  ) {
    return this.costCentersService.updateCostCenter(id, orgId, dto);
  }

  @RequirePermissions("accounting.manage_accounts")
  @Delete(":id")
  deleteCostCenter(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.costCentersService.deleteCostCenter(id, orgId);
  }
}

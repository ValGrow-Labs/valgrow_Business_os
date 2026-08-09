import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { LandedCostsService } from "./landed-costs.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateLandedCostDto } from "./dto/create-landed-cost.dto";

@Controller("landed-costs")
export class LandedCostsController {
  constructor(private readonly service: LandedCostsService) {}

  @RequirePermissions("purchasing.read")
  @Get()
  getAll(@CurrentOrg("id") orgId: string) {
    return this.service.getLandedCosts(orgId);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id")
  getOne(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.service.getLandedCostById(id, orgId);
  }

  @RequirePermissions("purchasing.create")
  @Post()
  create(@CurrentOrg("id") orgId: string, @Body() dto: CreateLandedCostDto) {
    return this.service.createLandedCost(orgId, dto);
  }
}

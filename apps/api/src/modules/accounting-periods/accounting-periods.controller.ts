import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
} from "@nestjs/common";
import { AccountingPeriodsService } from "./accounting-periods.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { UpdatePeriodStatusDto } from "./dto/update-period-status.dto";

@Controller("accounting-periods")
export class AccountingPeriodsController {
  constructor(private readonly periodsService: AccountingPeriodsService) {}

  @RequirePermissions("accounting.read")
  @Get()
  getPeriods(
    @CurrentOrg("id") orgId: string,
    @Query("fiscalYearId") fiscalYearId?: string,
  ) {
    return this.periodsService.getPeriods(orgId, fiscalYearId);
  }

  @RequirePermissions("accounting.read")
  @Get(":id")
  getPeriod(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.periodsService.getPeriod(id, orgId);
  }

  @RequirePermissions("accounting.close_period")
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdatePeriodStatusDto,
  ) {
    return this.periodsService.updateStatus(id, orgId, dto.status);
  }
}

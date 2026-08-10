import { Controller, Get, Query } from "@nestjs/common";
import { TaxAccountingService } from "./tax-accounting.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("tax-reports")
export class TaxAccountingController {
  constructor(private readonly taxService: TaxAccountingService) {}

  @RequirePermissions("accounting.manage_tax")
  @Get("summary")
  getTaxSummary(
    @CurrentOrg("id") orgId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.taxService.getTaxSummary(orgId, startDate, endDate);
  }
}

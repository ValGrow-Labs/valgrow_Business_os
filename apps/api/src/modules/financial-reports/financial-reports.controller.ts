import { Controller, Get, Query, Param } from "@nestjs/common";
import { FinancialReportsService } from "./financial-reports.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("financial-reports")
export class FinancialReportsController {
  constructor(private readonly reportsService: FinancialReportsService) {}

  @RequirePermissions("accounting.read")
  @Get("trial-balance")
  getTrialBalance(
    @CurrentOrg("id") orgId: string,
    @Query("asOfDate") asOfDate?: string,
  ) {
    return this.reportsService.getTrialBalance(orgId, asOfDate);
  }

  @RequirePermissions("accounting.read")
  @Get("profit-and-loss")
  getProfitAndLoss(
    @CurrentOrg("id") orgId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.reportsService.getProfitAndLoss(orgId, startDate, endDate);
  }

  @RequirePermissions("accounting.read")
  @Get("balance-sheet")
  getBalanceSheet(
    @CurrentOrg("id") orgId: string,
    @Query("asOfDate") asOfDate?: string,
  ) {
    return this.reportsService.getBalanceSheet(orgId, asOfDate);
  }

  @RequirePermissions("accounting.read")
  @Get("general-ledger/:accountId")
  getGeneralLedgerDetail(
    @CurrentOrg("id") orgId: string,
    @Param("accountId") accountId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.reportsService.getGeneralLedgerDetail(orgId, accountId, startDate, endDate);
  }
}

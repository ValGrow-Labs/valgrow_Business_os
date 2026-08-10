import { Controller, Get, Query, Param } from "@nestjs/common";
import { ArSubLedgerService } from "./ar-subledger.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("accounts-receivable")
export class ArSubLedgerController {
  constructor(private readonly arService: ArSubLedgerService) {}

  @RequirePermissions("accounting.read")
  @Get("balances")
  async getCustomerBalances(@CurrentOrg("id") orgId: string) {
    return this.arService.getCustomerBalances(orgId);
  }

  @RequirePermissions("accounting.read")
  @Get("aging")
  async getCustomerAging(
    @CurrentOrg("id") orgId: string,
    @Query("customerId") customerId?: string,
  ) {
    return this.arService.getCustomerAging(orgId, customerId);
  }

  @RequirePermissions("accounting.read")
  @Get("statement/:customerId")
  async getCustomerStatement(
    @CurrentOrg("id") orgId: string,
    @Param("customerId") customerId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.arService.getCustomerStatement(orgId, customerId, startDate, endDate);
  }
}

import { Controller, Get, Query, Param } from "@nestjs/common";
import { ApSubLedgerService } from "./ap-subledger.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("accounts-payable")
export class ApSubLedgerController {
  constructor(private readonly apService: ApSubLedgerService) {}

  @RequirePermissions("accounting.read")
  @Get("balances")
  async getSupplierBalances(@CurrentOrg("id") orgId: string) {
    return this.apService.getSupplierBalances(orgId);
  }

  @RequirePermissions("accounting.read")
  @Get("aging")
  async getSupplierAging(
    @CurrentOrg("id") orgId: string,
    @Query("supplierId") supplierId?: string,
  ) {
    return this.apService.getSupplierAging(orgId, supplierId);
  }

  @RequirePermissions("accounting.read")
  @Get("statement/:supplierId")
  async getSupplierStatement(
    @CurrentOrg("id") orgId: string,
    @Param("supplierId") supplierId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.apService.getSupplierStatement(orgId, supplierId, startDate, endDate);
  }
}

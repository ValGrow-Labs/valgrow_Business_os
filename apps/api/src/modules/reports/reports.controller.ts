import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import {
  SalesReportQueryDto,
  CustomerReportQueryDto,
  InventoryMovementReportQueryDto,
} from "./dto/report-query.dto";

@Controller("reports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("sales")
  @RequirePermissions("sales.read")
  getSalesReport(
    @CurrentOrg("id") orgId: string,
    @Query() query: SalesReportQueryDto,
  ) {
    return this.reportsService.getSalesReport(orgId, query);
  }

  @Get("customers")
  @RequirePermissions("sales.read")
  getCustomerReport(
    @CurrentOrg("id") orgId: string,
    @Query() query: CustomerReportQueryDto,
  ) {
    return this.reportsService.getCustomerReport(orgId, query);
  }

  @Get("inventory-movements")
  @RequirePermissions("inventory.read")
  getInventoryMovementReport(
    @CurrentOrg("id") orgId: string,
    @Query() query: InventoryMovementReportQueryDto,
  ) {
    return this.reportsService.getInventoryMovementReport(orgId, query);
  }
}

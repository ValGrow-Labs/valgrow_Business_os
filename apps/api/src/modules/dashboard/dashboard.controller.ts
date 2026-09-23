import { Controller, Get, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardOverviewDto } from "./dto/dashboard-overview.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("overview")
  getOverview(
    @CurrentOrg("id") organizationId: string,
  ): Promise<DashboardOverviewDto> {
    return this.dashboardService.getOverview(organizationId);
  }
}

import { Controller, Get } from "@nestjs/common";
import { ActivityLogsService } from "./activity-logs.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";

@Controller("activity-logs")
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  async getActivityLogs(@CurrentOrg("id") organizationId: string) {
    return this.activityLogsService.getActivityLogs(organizationId);
  }
}

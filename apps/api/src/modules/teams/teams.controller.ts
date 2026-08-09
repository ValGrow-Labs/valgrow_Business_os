import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { TeamsService } from "./teams.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async getTeams(@CurrentOrg("id") organizationId: string) {
    return this.teamsService.getTeams(organizationId);
  }

  @RequirePermissions("teams.manage")
  @Post()
  async createTeam(
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.teamsService.createTeam(organizationId, body);
  }

  @RequirePermissions("teams.manage")
  @Patch(":id")
  async updateTeam(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.teamsService.updateTeam(id, organizationId, body);
  }
}

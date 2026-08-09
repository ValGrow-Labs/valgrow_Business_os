import { Controller, Get, Patch, Body } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("organization")
  async getOrgSettings(@CurrentOrg("id") organizationId: string) {
    return this.settingsService.getOrgSettings(organizationId);
  }

  @RequirePermissions("settings.manage")
  @Patch("organization")
  async updateOrgSettings(
    @CurrentOrg("id") organizationId: string,
    @Body("settings")
    settings: Array<{ key: string; value: string; scope?: string }>,
  ) {
    return this.settingsService.updateOrgSettings(
      organizationId,
      settings || [],
    );
  }

  @Get("user")
  async getUserSettings(@CurrentUser("id") userId: string) {
    return this.settingsService.getUserSettings(userId);
  }

  @Patch("user")
  async updateUserSettings(
    @CurrentUser("id") userId: string,
    @Body("settings") settings: Array<{ key: string; value: string }>,
  ) {
    return this.settingsService.updateUserSettings(userId, settings || []);
  }
}

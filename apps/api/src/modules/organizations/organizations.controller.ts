import { Controller, Get, Patch, Param, Body } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async getMyOrganizations(@CurrentUser("id") userId: string) {
    return this.organizationsService.getUserOrganizations(userId);
  }

  @Get(":id")
  async getOrganization(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.organizationsService.getOrganizationById(id, userId);
  }

  @RequirePermissions("organization.manage")
  @Patch(":id")
  async updateOrganization(
    @Param("id") id: string,
    @CurrentOrg("id") activeOrgId: string,
    @Body() body: any,
  ) {
    return this.organizationsService.updateOrganization(id, activeOrgId, body);
  }
}

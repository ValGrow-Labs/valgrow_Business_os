import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async getRoles(@CurrentOrg("id") organizationId: string) {
    return this.rolesService.getRoles(organizationId);
  }

  @RequirePermissions("roles.manage")
  @Post()
  async createRole(
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.rolesService.createRole(organizationId, body);
  }

  @RequirePermissions("roles.manage")
  @Patch(":id")
  async updateRole(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.rolesService.updateRole(id, organizationId, body);
  }
}

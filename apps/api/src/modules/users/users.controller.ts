import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(@CurrentOrg("id") organizationId: string) {
    return this.usersService.getOrganizationUsers(organizationId);
  }

  @RequirePermissions("users.create")
  @Post()
  async createUser(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() body: any,
  ) {
    return this.usersService.createUser(organizationId, body, actorId);
  }

  @RequirePermissions("users.write")
  @Patch(":id")
  async updateUser(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.usersService.updateUser(id, organizationId, body);
  }
}

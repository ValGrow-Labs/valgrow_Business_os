import { Controller, Get, Post, Patch, Param, Body, Req } from "@nestjs/common";
import { Request } from "express";
import { UsersService } from "./users.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentMember } from "../../common/decorators/current-member.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ResetUserPasswordDto } from "./dto/reset-user-password.dto";

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

  @RequirePermissions("users.write")
  @Post(":id/reset-password")
  async resetUserPassword(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser() actor: any,
    @CurrentMember() actorMember: any,
    @Body() dto: ResetUserPasswordDto,
    @Req() req: Request,
  ) {
    return this.usersService.resetUserPassword(
      id,
      organizationId,
      actor,
      actorMember,
      dto,
      req,
    );
  }
}

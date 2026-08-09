import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { BranchesService } from "./branches.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("branches")
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  async getBranches(@CurrentOrg("id") organizationId: string) {
    return this.branchesService.getBranches(organizationId);
  }

  @Get(":id")
  async getBranch(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.branchesService.getBranchById(id, organizationId);
  }

  @RequirePermissions("branches.manage")
  @Post()
  async createBranch(
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.branchesService.createBranch(organizationId, body);
  }

  @RequirePermissions("branches.manage")
  @Patch(":id")
  async updateBranch(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.branchesService.updateBranch(id, organizationId, body);
  }

  @RequirePermissions("branches.manage")
  @Delete(":id")
  async deleteBranch(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.branchesService.deleteBranch(id, organizationId);
  }
}

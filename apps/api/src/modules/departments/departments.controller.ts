import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async getDepartments(@CurrentOrg("id") organizationId: string) {
    return this.departmentsService.getDepartments(organizationId);
  }

  @RequirePermissions("departments.manage")
  @Post()
  async createDepartment(
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.departmentsService.createDepartment(organizationId, body);
  }

  @RequirePermissions("departments.manage")
  @Patch(":id")
  async updateDepartment(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() body: any,
  ) {
    return this.departmentsService.updateDepartment(id, organizationId, body);
  }
}

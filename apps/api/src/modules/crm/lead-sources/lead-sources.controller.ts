import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { LeadSourcesService } from "./lead-sources.service";
import { CreateLeadSourceDto } from "./dto/create-lead-source.dto";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/lead-sources")
export class LeadSourcesController {
  constructor(private readonly leadSourcesService: LeadSourcesService) {}

  @Get()
  @RequirePermissions("crm.read")
  getLeadSources(@CurrentOrg("id") organizationId: string) {
    return this.leadSourcesService.getLeadSources(organizationId);
  }

  @Post()
  @RequirePermissions("crm.manage_sources")
  createLeadSource(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateLeadSourceDto,
  ) {
    return this.leadSourcesService.createLeadSource(organizationId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.manage_sources")
  deleteLeadSource(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.leadSourcesService.deleteLeadSource(id, organizationId);
  }
}

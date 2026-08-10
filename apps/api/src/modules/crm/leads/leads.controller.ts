import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { CreateLeadDto, UpdateLeadDto, ConvertLeadDto } from "./dto/lead.dtos";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermissions("crm.read")
  getLeads(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
    @Query("stageId") stageId?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("search") search?: string,
  ) {
    return this.leadsService.getLeads(organizationId, {
      status,
      stageId,
      assignedToId,
      search,
    });
  }

  @Get(":id")
  @RequirePermissions("crm.read")
  getLeadById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.leadsService.getLeadById(id, organizationId);
  }

  @Post()
  @RequirePermissions("crm.create")
  createLead(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.createLead(organizationId, actorId, dto);
  }

  @Patch(":id")
  @RequirePermissions("crm.update")
  updateLead(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.updateLead(id, organizationId, actorId, dto);
  }

  @Post(":id/convert")
  @RequirePermissions("crm.convert")
  convertLead(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.leadsService.convertLead(id, organizationId, actorId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.delete")
  deleteLead(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.leadsService.deleteLead(id, organizationId);
  }
}

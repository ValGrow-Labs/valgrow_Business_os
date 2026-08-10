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
import { OpportunitiesService } from "./opportunities.service";
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  UpdateOpportunityStageDto,
} from "./dto/opportunity.dtos";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/opportunities")
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @RequirePermissions("crm.read")
  getOpportunities(
    @CurrentOrg("id") organizationId: string,
    @Query("pipelineId") pipelineId?: string,
    @Query("stageId") stageId?: string,
    @Query("customerId") customerId?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return this.opportunitiesService.getOpportunities(organizationId, {
      pipelineId,
      stageId,
      customerId,
      assignedToId,
      status,
      search,
    });
  }

  @Get(":id")
  @RequirePermissions("crm.read")
  getOpportunityById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.opportunitiesService.getOpportunityById(id, organizationId);
  }

  @Post()
  @RequirePermissions("crm.create")
  createOpportunity(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: CreateOpportunityDto,
  ) {
    return this.opportunitiesService.createOpportunity(
      organizationId,
      actorId,
      dto,
    );
  }

  @Patch(":id")
  @RequirePermissions("crm.update")
  updateOpportunity(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.opportunitiesService.updateOpportunity(
      id,
      organizationId,
      actorId,
      dto,
    );
  }

  @Patch(":id/stage")
  @RequirePermissions("crm.update")
  updateStage(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: UpdateOpportunityStageDto,
  ) {
    return this.opportunitiesService.updateStage(
      id,
      organizationId,
      actorId,
      dto,
    );
  }

  @Delete(":id")
  @RequirePermissions("crm.delete")
  deleteOpportunity(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.opportunitiesService.deleteOpportunity(id, organizationId);
  }
}

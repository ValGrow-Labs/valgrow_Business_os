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
import { CrmActivitiesService } from "./crm-activities.service";
import { CreateActivityDto, UpdateActivityDto } from "./dto/activity.dtos";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/activities")
export class CrmActivitiesController {
  constructor(private readonly activitiesService: CrmActivitiesService) {}

  @Get()
  @RequirePermissions("crm.read")
  getActivities(
    @CurrentOrg("id") organizationId: string,
    @Query("customerId") customerId?: string,
    @Query("leadId") leadId?: string,
    @Query("opportunityId") opportunityId?: string,
    @Query("assignedToId") assignedToId?: string,
  ) {
    return this.activitiesService.getActivities(organizationId, {
      customerId,
      leadId,
      opportunityId,
      assignedToId,
    });
  }

  @Post()
  @RequirePermissions("crm.create")
  createActivity(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") creatorId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.createActivity(
      organizationId,
      creatorId,
      dto,
    );
  }

  @Patch(":id")
  @RequirePermissions("crm.update")
  updateActivity(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.updateActivity(id, organizationId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.delete")
  deleteActivity(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.activitiesService.deleteActivity(id, organizationId);
  }
}

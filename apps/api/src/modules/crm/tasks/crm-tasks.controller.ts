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
import { CrmTasksService } from "./crm-tasks.service";
import { CreateTaskDto, UpdateTaskDto } from "./dto/task.dtos";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/tasks")
export class CrmTasksController {
  constructor(private readonly tasksService: CrmTasksService) {}

  @Get()
  @RequirePermissions("crm.read")
  getTasks(
    @CurrentOrg("id") organizationId: string,
    @Query("customerId") customerId?: string,
    @Query("leadId") leadId?: string,
    @Query("opportunityId") opportunityId?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("status") status?: string,
  ) {
    return this.tasksService.getTasks(organizationId, {
      customerId,
      leadId,
      opportunityId,
      assignedToId,
      status,
    });
  }

  @Post()
  @RequirePermissions("crm.create")
  createTask(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") creatorId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(organizationId, creatorId, dto);
  }

  @Patch(":id")
  @RequirePermissions("crm.update")
  updateTask(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(id, organizationId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.delete")
  deleteTask(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.tasksService.deleteTask(id, organizationId);
  }
}

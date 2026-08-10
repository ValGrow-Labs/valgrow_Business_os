import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { PipelinesService } from "./pipelines.service";
import {
  CreatePipelineDto,
  UpdatePipelineDto,
  CreateStageDto,
  UpdateStageDto,
} from "./dto/pipeline.dtos";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/pipelines")
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  @RequirePermissions("crm.read")
  getPipelines(@CurrentOrg("id") organizationId: string) {
    return this.pipelinesService.getPipelines(organizationId);
  }

  @Get(":id")
  @RequirePermissions("crm.read")
  getPipelineById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.pipelinesService.getPipelineById(id, organizationId);
  }

  @Post()
  @RequirePermissions("crm.manage_pipeline")
  createPipeline(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreatePipelineDto,
  ) {
    return this.pipelinesService.createPipeline(organizationId, dto);
  }

  @Patch(":id")
  @RequirePermissions("crm.manage_pipeline")
  updatePipeline(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdatePipelineDto,
  ) {
    return this.pipelinesService.updatePipeline(id, organizationId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.manage_pipeline")
  deletePipeline(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.pipelinesService.deletePipeline(id, organizationId);
  }

  @Post(":id/stages")
  @RequirePermissions("crm.manage_pipeline")
  addStage(
    @Param("id") pipelineId: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.pipelinesService.addStage(pipelineId, organizationId, dto);
  }

  @Patch("stages/:stageId")
  @RequirePermissions("crm.manage_pipeline")
  updateStage(
    @Param("stageId") stageId: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.pipelinesService.updateStage(stageId, organizationId, dto);
  }

  @Delete("stages/:stageId")
  @RequirePermissions("crm.manage_pipeline")
  deleteStage(
    @Param("stageId") stageId: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.pipelinesService.deleteStage(stageId, organizationId);
  }
}

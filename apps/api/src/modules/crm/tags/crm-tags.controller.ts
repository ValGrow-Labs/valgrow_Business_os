import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { CrmTagsService } from "./crm-tags.service";
import { CreateTagDto, AssignTagDto, UnassignTagDto } from "./dto/tag.dtos";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/tags")
export class CrmTagsController {
  constructor(private readonly tagsService: CrmTagsService) {}

  @Get()
  @RequirePermissions("crm.read")
  getTags(@CurrentOrg("id") organizationId: string) {
    return this.tagsService.getTags(organizationId);
  }

  @Post()
  @RequirePermissions("crm.manage_tags")
  createTag(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagsService.createTag(organizationId, dto);
  }

  @Post("assign")
  @RequirePermissions("crm.manage_tags")
  assignTag(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: AssignTagDto,
  ) {
    return this.tagsService.assignTag(organizationId, dto);
  }

  @Post("unassign")
  @RequirePermissions("crm.manage_tags")
  unassignTag(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UnassignTagDto,
  ) {
    return this.tagsService.unassignTag(organizationId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.manage_tags")
  deleteTag(@Param("id") id: string, @CurrentOrg("id") organizationId: string) {
    return this.tagsService.deleteTag(id, organizationId);
  }
}

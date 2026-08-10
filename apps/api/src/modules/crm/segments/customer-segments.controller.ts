import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { CustomerSegmentsService } from "./customer-segments.service";
import { CreateSegmentDto } from "./dto/create-segment.dto";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/segments")
export class CustomerSegmentsController {
  constructor(private readonly segmentsService: CustomerSegmentsService) {}

  @Get()
  @RequirePermissions("crm.read")
  getSegments(@CurrentOrg("id") organizationId: string) {
    return this.segmentsService.getSegments(organizationId);
  }

  @Get(":id")
  @RequirePermissions("crm.read")
  getSegmentById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.segmentsService.getSegmentById(id, organizationId);
  }

  @Get(":id/customers")
  @RequirePermissions("crm.read")
  getSegmentCustomers(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.segmentsService.getSegmentCustomers(id, organizationId);
  }

  @Post()
  @RequirePermissions("crm.create")
  createSegment(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateSegmentDto,
  ) {
    return this.segmentsService.createSegment(organizationId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.delete")
  deleteSegment(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.segmentsService.deleteSegment(id, organizationId);
  }
}

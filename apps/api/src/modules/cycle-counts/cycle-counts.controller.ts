import { Controller, Get, Post, Patch, Param, Query, Body } from "@nestjs/common";
import { CycleCountsService } from "./cycle-counts.service";
import { CreateCycleCountDto, UpdateCountItemsDto } from "./dto/cycle-count.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CycleCountStatus } from "@prisma/client";

@Controller("inventory/cycle-counts")
export class CycleCountsController {
  constructor(private readonly cycleCountsService: CycleCountsService) {}

  @RequirePermissions("inventory.create")
  @Post()
  async create(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCycleCountDto,
  ) {
    return this.cycleCountsService.create(organizationId, userId, dto);
  }

  @RequirePermissions("inventory.read")
  @Get()
  async findAll(
    @CurrentOrg("id") organizationId: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("status") status?: CycleCountStatus,
  ) {
    return this.cycleCountsService.findAll(organizationId, warehouseId, status);
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentOrg("id") organizationId: string) {
    return this.cycleCountsService.findOne(id, organizationId);
  }

  @RequirePermissions("inventory.update")
  @Patch(":id/items")
  async updateItemCounts(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateCountItemsDto,
  ) {
    return this.cycleCountsService.updateItemCounts(id, organizationId, dto.items);
  }

  @RequirePermissions("inventory.update")
  @Post(":id/post")
  async postVariances(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.cycleCountsService.postVariances(id, organizationId, userId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { InventoryBatchesService } from "./inventory-batches.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { UpdateBatchDto } from "./dto/update-batch.dto";

@Controller("inventory/batches")
export class InventoryBatchesController {
  constructor(
    private readonly batchesService: InventoryBatchesService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getBatches(
    @CurrentOrg("id") organizationId: string,
    @Query("productId") productId?: string,
    @Query("variantId") variantId?: string,
    @Query("batchType") batchType?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("expired") expired?: boolean,
    @Query("expiringSoonDays") expiringSoonDays?: number,
  ) {
    return this.batchesService.getBatches(organizationId, {
      productId,
      variantId,
      batchType,
      status,
      search,
      expired: expired ? String(expired) === "true" : undefined,
      expiringSoonDays: expiringSoonDays ? Number(expiringSoonDays) : undefined,
    });
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async getBatch(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.batchesService.getBatchById(id, organizationId);
  }

  @RequirePermissions("inventory.create")
  @Post()
  async createBatch(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateBatchDto,
  ) {
    const batch = await this.batchesService.createBatch(organizationId, dto);

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "CREATE_BATCH",
      "InventoryBatch",
      batch.id,
      { batchNumber: batch.batchNumber, productId: batch.productId, batchType: batch.batchType },
    );

    return batch;
  }

  @RequirePermissions("inventory.update")
  @Patch(":id")
  async updateBatch(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateBatchDto,
  ) {
    const batch = await this.batchesService.updateBatch(id, organizationId, dto);

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "UPDATE_BATCH",
      "InventoryBatch",
      id,
      { dto },
    );

    return batch;
  }
}

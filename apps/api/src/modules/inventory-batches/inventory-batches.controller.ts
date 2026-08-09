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
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { UpdateBatchDto } from "./dto/update-batch.dto";

@Controller("inventory/batches")
export class InventoryBatchesController {
  constructor(private readonly batchesService: InventoryBatchesService) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getBatches(
    @CurrentOrg("id") organizationId: string,
    @Query("productId") productId?: string,
    @Query("variantId") variantId?: string,
    @Query("expired") expired?: boolean,
    @Query("expiringSoonDays") expiringSoonDays?: number,
  ) {
    return this.batchesService.getBatches(organizationId, {
      productId,
      variantId,
      expired: expired ? String(expired) === "true" : undefined,
      expiringSoonDays,
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
    @Body() dto: CreateBatchDto,
  ) {
    return this.batchesService.createBatch(organizationId, dto);
  }

  @RequirePermissions("inventory.update")
  @Patch(":id")
  async updateBatch(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.batchesService.updateBatch(id, organizationId, dto);
  }
}

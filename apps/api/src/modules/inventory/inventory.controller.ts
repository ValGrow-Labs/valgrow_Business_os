import { Controller, Get, Param, Query } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @RequirePermissions("inventory.read")
  @Get("stock")
  async getStock(
    @CurrentOrg("id") organizationId: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("locationId") locationId?: string,
    @Query("productId") productId?: string,
    @Query("variantId") variantId?: string,
    @Query("batchId") batchId?: string,
    @Query("lowStock") lowStock?: boolean,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.inventoryService.getStock(organizationId, {
      warehouseId,
      locationId,
      productId,
      variantId,
      batchId,
      lowStock: lowStock ? String(lowStock) === "true" : undefined,
      search,
      page,
      limit,
    });
  }

  @RequirePermissions("inventory.read")
  @Get("stock/:id")
  async getStockById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.inventoryService.getStockById(id, organizationId);
  }
}

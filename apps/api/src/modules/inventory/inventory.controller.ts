import { Controller, Get, Patch, Param, Query, Body, Res, Header } from "@nestjs/common";
import { Response } from "express";
import { InventoryService } from "./inventory.service";
import { UpdateReorderSettingsDto } from "./dto/update-reorder-settings.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";

@Controller("inventory")
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @RequirePermissions("inventory.read")
  @Get("stock")
  async getStock(
    @CurrentOrg("id") organizationId: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("branchId") branchId?: string,
    @Query("locationId") locationId?: string,
    @Query("productId") productId?: string,
    @Query("variantId") variantId?: string,
    @Query("batchId") batchId?: string,
    @Query("lowStock") lowStock?: boolean,
    @Query("health") health?: "OK" | "LOW" | "OUT",
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.inventoryService.getStock(organizationId, {
      warehouseId,
      branchId,
      locationId,
      productId,
      variantId,
      batchId,
      lowStock: lowStock ? String(lowStock) === "true" : undefined,
      health,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }

  @RequirePermissions("inventory.read")
  @Get("purchase-suggestions")
  async getPurchaseSuggestions(@CurrentOrg("id") organizationId: string) {
    return this.inventoryService.getPurchaseSuggestions(organizationId);
  }

  @RequirePermissions("inventory.read")
  @Get("stock/export/csv")
  async exportCsv(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Res() res: Response,
    @Query("warehouseId") warehouseId?: string,
    @Query("branchId") branchId?: string,
    @Query("health") health?: "OK" | "LOW" | "OUT",
    @Query("search") search?: string,
  ) {
    const csvContent = await this.inventoryService.exportCsv(organizationId, {
      warehouseId,
      branchId,
      health,
      search,
    });

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "EXPORT_INVENTORY_STOCK_CSV",
      "InventoryStock",
      "ALL",
      { warehouseId, branchId, health, search },
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="stock_levels.csv"');
    return res.status(200).send(csvContent);
  }

  @RequirePermissions("inventory.read")
  @Get("stock/export/pdf")
  async exportPdf(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Res() res: Response,
    @Query("warehouseId") warehouseId?: string,
    @Query("branchId") branchId?: string,
    @Query("health") health?: "OK" | "LOW" | "OUT",
    @Query("search") search?: string,
  ) {
    const htmlReport = await this.inventoryService.exportPdfReport(organizationId, {
      warehouseId,
      branchId,
      health,
      search,
    });

    await this.activityLogsService.logEvent(
      organizationId,
      userId || null,
      "EXPORT_INVENTORY_STOCK_PDF",
      "InventoryStock",
      "ALL",
      { warehouseId, branchId, health, search },
    );

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(htmlReport);
  }

  @RequirePermissions("inventory.update")
  @Patch("stock/:id/reorder-settings")
  async updateReorderSettings(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateReorderSettingsDto,
  ) {
    return this.inventoryService.updateReorderSettings(
      id,
      organizationId,
      dto.reorderLevel ?? 0,
      dto.reorderQuantity ?? null,
    );
  }

  @RequirePermissions("inventory.read")
  @Get("analytics/abc")
  async getAbcAnalysis(@CurrentOrg("id") organizationId: string) {
    return this.inventoryService.getAbcAnalysis(organizationId);
  }

  @RequirePermissions("inventory.read")
  @Get("analytics/movement-velocity")
  async getMovementVelocity(
    @CurrentOrg("id") organizationId: string,
    @Query("days") days?: number,
  ) {
    return this.inventoryService.getMovementVelocity(organizationId, days);
  }

  @RequirePermissions("inventory.read")
  @Get("analytics/dead-stock")
  async getDeadStock(
    @CurrentOrg("id") organizationId: string,
    @Query("inactiveDays") inactiveDays?: number,
  ) {
    return this.inventoryService.getDeadStock(organizationId, inactiveDays);
  }

  @RequirePermissions("inventory.read")
  @Get("analytics/forecast")
  async getStockForecast(
    @CurrentOrg("id") organizationId: string,
    @Query("lookbackDays") lookbackDays?: number,
  ) {
    return this.inventoryService.getStockForecast(organizationId, lookbackDays);
  }

  @RequirePermissions("inventory.read")
  @Get("timeline")
  async getInventoryTimeline(
    @CurrentOrg("id") organizationId: string,
    @Query("productId") productId?: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("locationId") locationId?: string,
    @Query("batchId") batchId?: string,
    @Query("limit") limit?: number,
  ) {
    return this.inventoryService.getInventoryTimeline(organizationId, {
      productId,
      warehouseId,
      locationId,
      batchId,
      limit,
    });
  }

  @RequirePermissions("inventory.read")
  @Get("audit-trail")
  async getAuditTrail(
    @CurrentOrg("id") organizationId: string,
    @Query("productId") productId?: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("locationId") locationId?: string,
    @Query("actorId") actorId?: string,
    @Query("movementType") movementType?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.inventoryService.getAuditTrail(organizationId, {
      productId,
      warehouseId,
      locationId,
      actorId,
      movementType,
      dateFrom,
      dateTo,
      page,
      limit,
    });
  }

  @RequirePermissions("inventory.read")
  @Get("valuation-report")
  async getValuationReport(
    @CurrentOrg("id") organizationId: string,
    @Query("warehouseId") warehouseId?: string,
    @Query("method") method?: "FIFO" | "LIFO" | "WEIGHTED_AVERAGE",
  ) {
    return this.inventoryService.getValuationReport(organizationId, warehouseId, method);
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




import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { SalesOrdersService } from "./sales-orders.service";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";
import { UpdateSalesOrderDto } from "./dto/update-sales-order.dto";
import { SalesOrderActionDto } from "./dto/sales-order-action.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("sales-orders")
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  @RequirePermissions("sales.read")
  getSalesOrders(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.salesOrdersService.getSalesOrders(organizationId, status);
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  getSalesOrderById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.salesOrdersService.getSalesOrderById(id, organizationId);
  }

  @Post()
  @RequirePermissions("sales.create")
  createSalesOrder(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateSalesOrderDto,
  ) {
    return this.salesOrdersService.createSalesOrder(organizationId, dto);
  }

  @Patch(":id")
  @RequirePermissions("sales.update")
  updateSalesOrder(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateSalesOrderDto,
  ) {
    return this.salesOrdersService.updateSalesOrder(id, organizationId, dto);
  }

  @Post(":id/confirm")
  @RequirePermissions("sales.approve")
  confirm(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: SalesOrderActionDto,
  ) {
    return this.salesOrdersService.confirm(id, organizationId, userId, dto);
  }

  @Post(":id/process")
  @RequirePermissions("sales.update")
  process(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: SalesOrderActionDto,
  ) {
    return this.salesOrdersService.process(id, organizationId, userId, dto);
  }

  @Post(":id/cancel")
  @RequirePermissions("sales.update")
  cancel(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: SalesOrderActionDto,
  ) {
    return this.salesOrdersService.cancel(id, organizationId, userId, dto);
  }
}

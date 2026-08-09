import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { SalesReturnsService } from "./sales-returns.service";
import { CreateSalesReturnDto } from "./dto/create-sales-return.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("sales-returns")
export class SalesReturnsController {
  constructor(private readonly salesReturnsService: SalesReturnsService) {}

  @Get()
  @RequirePermissions("sales.read")
  getSalesReturns(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.salesReturnsService.getSalesReturns(organizationId, status);
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  getSalesReturnById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.salesReturnsService.getSalesReturnById(id, organizationId);
  }

  @Post()
  @RequirePermissions("sales.return", "sales.create")
  createSalesReturn(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateSalesReturnDto,
  ) {
    return this.salesReturnsService.createSalesReturn(organizationId, dto);
  }

  @Post(":id/post")
  @RequirePermissions("sales.return")
  postSalesReturn(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.salesReturnsService.postSalesReturn(id, organizationId, userId);
  }

  @Post(":id/cancel")
  @RequirePermissions("sales.return")
  cancelSalesReturn(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.salesReturnsService.cancelSalesReturn(
      id,
      organizationId,
      userId,
    );
  }
}

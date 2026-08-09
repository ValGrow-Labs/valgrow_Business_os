import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { SalesInvoicesService } from "./sales-invoices.service";
import { CreateSalesInvoiceDto } from "./dto/create-sales-invoice.dto";
import { UpdateSalesInvoiceDto } from "./dto/update-sales-invoice.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("sales-invoices")
export class SalesInvoicesController {
  constructor(private readonly salesInvoicesService: SalesInvoicesService) {}

  @Get()
  @RequirePermissions("sales.read")
  getSalesInvoices(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.salesInvoicesService.getSalesInvoices(organizationId, status);
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  getSalesInvoiceById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.salesInvoicesService.getSalesInvoiceById(id, organizationId);
  }

  @Post()
  @RequirePermissions("sales.invoice", "sales.create")
  createSalesInvoice(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateSalesInvoiceDto,
  ) {
    return this.salesInvoicesService.createSalesInvoice(organizationId, dto);
  }

  @Patch(":id")
  @RequirePermissions("sales.update")
  updateSalesInvoice(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateSalesInvoiceDto,
  ) {
    return this.salesInvoicesService.updateSalesInvoice(
      id,
      organizationId,
      dto,
    );
  }

  @Post(":id/post")
  @RequirePermissions("sales.invoice")
  postSalesInvoice(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.salesInvoicesService.postSalesInvoice(
      id,
      organizationId,
      userId,
    );
  }

  @Post(":id/cancel")
  @RequirePermissions("sales.invoice")
  cancelSalesInvoice(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.salesInvoicesService.cancelSalesInvoice(
      id,
      organizationId,
      userId,
    );
  }
}

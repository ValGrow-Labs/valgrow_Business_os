import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { SupplierInvoicesService } from "./supplier-invoices.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import {
  CreateSupplierInvoiceDto,
  UpdateSupplierInvoiceDto,
} from "./dto/supplier-invoice.dto";

import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("supplier-invoices")
export class SupplierInvoicesController {
  constructor(private readonly service: SupplierInvoicesService) {}

  @RequirePermissions("purchasing.read")
  @Get()
  getAll(@CurrentOrg("id") orgId: string) {
    return this.service.getInvoices(orgId);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id")
  getOne(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.service.getInvoiceById(id, orgId);
  }

  @RequirePermissions("purchasing.create")
  @Post()
  create(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateSupplierInvoiceDto,
  ) {
    return this.service.createInvoice(orgId, dto, userId);
  }

  @RequirePermissions("purchasing.update")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdateSupplierInvoiceDto,
  ) {
    return this.service.updateInvoice(id, orgId, dto);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id/three-way-match")
  threeWayMatch(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.service.threeWayMatch(id, orgId);
  }
}

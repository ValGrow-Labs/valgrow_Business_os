import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { SupplierPaymentsService } from "./supplier-payments.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";

import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("supplier-payments")
export class SupplierPaymentsController {
  constructor(private readonly service: SupplierPaymentsService) {}

  @RequirePermissions("purchasing.read")
  @Get()
  getAll(@CurrentOrg("id") orgId: string) {
    return this.service.getPayments(orgId);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id")
  getOne(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.service.getPaymentById(id, orgId);
  }

  @RequirePermissions("purchasing.pay")
  @Post()
  create(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateSupplierPaymentDto,
  ) {
    return this.service.createPayment(orgId, dto, userId);
  }
}

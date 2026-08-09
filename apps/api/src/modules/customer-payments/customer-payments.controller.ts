import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { CustomerPaymentsService } from "./customer-payments.service";
import { CreateCustomerPaymentDto } from "./dto/create-customer-payment.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("customer-payments")
export class CustomerPaymentsController {
  constructor(
    private readonly customerPaymentsService: CustomerPaymentsService,
  ) {}

  @Get()
  @RequirePermissions("sales.read")
  getCustomerPayments(
    @CurrentOrg("id") organizationId: string,
    @Query("customerId") customerId?: string,
  ) {
    return this.customerPaymentsService.getCustomerPayments(
      organizationId,
      customerId,
    );
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  getCustomerPaymentById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.customerPaymentsService.getCustomerPaymentById(
      id,
      organizationId,
    );
  }

  @Post()
  @RequirePermissions("sales.payment", "sales.create")
  createCustomerPayment(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCustomerPaymentDto,
  ) {
    return this.customerPaymentsService.createCustomerPayment(
      organizationId,
      userId,
      dto,
    );
  }
}

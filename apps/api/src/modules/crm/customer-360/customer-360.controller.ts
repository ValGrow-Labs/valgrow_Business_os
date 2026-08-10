import { Controller, Get, Param } from "@nestjs/common";
import { Customer360Service } from "./customer-360.service";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/customer-360")
export class Customer360Controller {
  constructor(private readonly customer360Service: Customer360Service) {}

  @Get(":customerId")
  @RequirePermissions("crm.read")
  getCustomer360(
    @Param("customerId") customerId: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.customer360Service.getCustomer360(customerId, organizationId);
  }
}

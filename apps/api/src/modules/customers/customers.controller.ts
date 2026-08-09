import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions("sales.read")
  getCustomers(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.customersService.getCustomers(organizationId, status);
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  getCustomerById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.customersService.getCustomerById(id, organizationId);
  }

  @Post()
  @RequirePermissions("sales.create")
  createCustomer(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.createCustomer(organizationId, dto);
  }

  @Patch(":id")
  @RequirePermissions("sales.update")
  updateCustomer(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(id, organizationId, dto);
  }

  @Delete(":id")
  @RequirePermissions("sales.delete")
  deleteCustomer(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.customersService.deleteCustomer(id, organizationId);
  }
}

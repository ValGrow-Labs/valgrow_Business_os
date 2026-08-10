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
import { CustomerContactsService } from "./customer-contacts.service";
import {
  CreateCustomerContactDto,
  UpdateCustomerContactDto,
} from "./dto/contact.dtos";
import { CurrentOrg } from "../../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../../common/decorators/require-permissions.decorator";

@Controller("crm/contacts")
export class CustomerContactsController {
  constructor(private readonly contactsService: CustomerContactsService) {}

  @Get()
  @RequirePermissions("crm.read")
  getContactsByCustomer(
    @Query("customerId") customerId: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.contactsService.getContactsByCustomer(
      customerId,
      organizationId,
    );
  }

  @Post()
  @RequirePermissions("crm.create")
  createContact(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateCustomerContactDto,
  ) {
    return this.contactsService.createContact(organizationId, dto);
  }

  @Patch(":id")
  @RequirePermissions("crm.update")
  updateContact(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateCustomerContactDto,
  ) {
    return this.contactsService.updateContact(id, organizationId, dto);
  }

  @Delete(":id")
  @RequirePermissions("crm.delete")
  deleteContact(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.contactsService.deleteContact(id, organizationId);
  }
}

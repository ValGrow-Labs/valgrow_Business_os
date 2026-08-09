import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { SuppliersService } from "./suppliers.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { CreateSupplierContactDto } from "./dto/create-supplier-contact.dto";
import { UpdateSupplierContactDto } from "./dto/update-supplier-contact.dto";

@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @RequirePermissions("purchasing.read")
  @Get()
  getSuppliers(@CurrentOrg("id") orgId: string) {
    return this.suppliersService.getSuppliers(orgId);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id")
  getSupplier(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.suppliersService.getSupplierById(id, orgId);
  }

  @RequirePermissions("purchasing.create")
  @Post()
  createSupplier(
    @CurrentOrg("id") orgId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.createSupplier(orgId, dto);
  }

  @RequirePermissions("purchasing.update")
  @Patch(":id")
  updateSupplier(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.updateSupplier(id, orgId, dto);
  }

  @RequirePermissions("purchasing.delete")
  @Delete(":id")
  deleteSupplier(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.suppliersService.deleteSupplier(id, orgId);
  }

  // --- Contacts ---

  @RequirePermissions("purchasing.read")
  @Get(":supplierId/contacts")
  getContacts(
    @Param("supplierId") supplierId: string,
    @CurrentOrg("id") orgId: string,
  ) {
    return this.suppliersService.getContacts(supplierId, orgId);
  }

  @RequirePermissions("purchasing.create")
  @Post(":supplierId/contacts")
  createContact(
    @Param("supplierId") supplierId: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: CreateSupplierContactDto,
  ) {
    return this.suppliersService.createContact(supplierId, orgId, dto);
  }

  @RequirePermissions("purchasing.update")
  @Patch(":supplierId/contacts/:id")
  updateContact(
    @Param("supplierId") supplierId: string,
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdateSupplierContactDto,
  ) {
    return this.suppliersService.updateContact(supplierId, id, orgId, dto);
  }

  @RequirePermissions("purchasing.delete")
  @Delete(":supplierId/contacts/:id")
  deleteContact(
    @Param("supplierId") supplierId: string,
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
  ) {
    return this.suppliersService.deleteContact(supplierId, id, orgId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { TaxesService } from "./taxes.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateTaxDto } from "./dto/create-tax.dto";
import { UpdateTaxDto } from "./dto/update-tax.dto";

@Controller("taxes")
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  async getTaxes(@CurrentOrg("id") organizationId: string) {
    return this.taxesService.getTaxes(organizationId);
  }

  @Get(":id")
  async getTax(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.taxesService.getTaxById(id, organizationId);
  }

  @RequirePermissions("settings.manage")
  @Post()
  async createTax(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateTaxDto,
  ) {
    return this.taxesService.createTax(organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Patch(":id")
  async updateTax(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateTaxDto,
  ) {
    return this.taxesService.updateTax(id, organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Delete(":id")
  async deleteTax(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.taxesService.deleteTax(id, organizationId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { BrandsService } from "./brands.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  async getBrands(@CurrentOrg("id") organizationId: string) {
    return this.brandsService.getBrands(organizationId);
  }

  @Get(":id")
  async getBrand(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.brandsService.getBrandById(id, organizationId);
  }

  @RequirePermissions("settings.manage")
  @Post()
  async createBrand(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateBrandDto,
  ) {
    return this.brandsService.createBrand(organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Patch(":id")
  async updateBrand(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.brandsService.updateBrand(id, organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Delete(":id")
  async deleteBrand(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.brandsService.deleteBrand(id, organizationId);
  }
}

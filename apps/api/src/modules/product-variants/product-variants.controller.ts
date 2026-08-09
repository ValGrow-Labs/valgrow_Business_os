import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { ProductVariantsService } from "./product-variants.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { UpdateVariantDto } from "./dto/update-variant.dto";

@Controller("products/:productId/variants")
export class ProductVariantsController {
  constructor(private readonly variantsService: ProductVariantsService) {}

  @Get()
  async getVariants(
    @Param("productId") productId: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.variantsService.getVariants(productId, organizationId);
  }

  @Get(":id")
  async getVariant(
    @Param("productId") productId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.variantsService.getVariantById(id, productId, organizationId);
  }

  @RequirePermissions("settings.manage")
  @Post()
  async createVariant(
    @Param("productId") productId: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.variantsService.createVariant(productId, organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Patch(":id")
  async updateVariant(
    @Param("productId") productId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.variantsService.updateVariant(
      id,
      productId,
      organizationId,
      dto,
    );
  }

  @RequirePermissions("settings.manage")
  @Delete(":id")
  async deleteVariant(
    @Param("productId") productId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.variantsService.deleteVariant(id, productId, organizationId);
  }
}

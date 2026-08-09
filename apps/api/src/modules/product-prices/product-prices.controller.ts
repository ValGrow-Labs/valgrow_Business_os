import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { ProductPricesService } from "./product-prices.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreatePriceDto } from "./dto/create-price.dto";
import { UpdatePriceDto } from "./dto/update-price.dto";

@Controller("products/:productId/prices")
export class ProductPricesController {
  constructor(private readonly pricesService: ProductPricesService) {}

  @Get()
  async getPrices(
    @Param("productId") productId: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.pricesService.getPrices(productId, organizationId);
  }

  @RequirePermissions("settings.manage")
  @Post()
  async createPrice(
    @Param("productId") productId: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreatePriceDto,
  ) {
    return this.pricesService.createPrice(productId, organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Patch(":id")
  async updatePrice(
    @Param("productId") productId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdatePriceDto,
  ) {
    return this.pricesService.updatePrice(id, productId, organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Delete(":id")
  async deletePrice(
    @Param("productId") productId: string,
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.pricesService.deletePrice(id, productId, organizationId);
  }
}

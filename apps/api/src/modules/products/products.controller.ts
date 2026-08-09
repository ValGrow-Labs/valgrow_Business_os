import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @CurrentOrg("id") organizationId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("categoryId") categoryId?: string,
    @Query("brandId") brandId?: string,
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.productsService.getProducts(organizationId, {
      page,
      limit,
      search,
      categoryId,
      brandId,
      status,
      type,
      sortBy,
      sortOrder,
    });
  }

  @Get(":id")
  async getProduct(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.productsService.getProductById(id, organizationId);
  }

  @RequirePermissions("settings.manage")
  @Post()
  async createProduct(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Patch(":id")
  async updateProduct(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Delete(":id")
  async deleteProduct(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.productsService.deleteProduct(id, organizationId);
  }
}

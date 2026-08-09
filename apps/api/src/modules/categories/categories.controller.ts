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
import { CategoriesService } from "./categories.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(
    @CurrentOrg("id") organizationId: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    return this.categoriesService.getCategories(organizationId, search, status);
  }

  @Get(":id")
  async getCategory(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.categoriesService.getCategoryById(id, organizationId);
  }

  @RequirePermissions("settings.manage")
  @Post()
  async createCategory(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Patch(":id")
  async updateCategory(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, organizationId, dto);
  }

  @RequirePermissions("settings.manage")
  @Delete(":id")
  async deleteCategory(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.categoriesService.deleteCategory(id, organizationId);
  }
}

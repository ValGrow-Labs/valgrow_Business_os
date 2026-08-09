import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async getCategories(
    organizationId: string,
    search?: string,
    status?: string,
  ) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCategoryById(id: string, organizationId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!category) {
      throw new NotFoundException("Category not found in this organization");
    }

    return category;
  }

  async createCategory(organizationId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, organizationId, deletedAt: null },
      });

      if (!parent) {
        throw new BadRequestException(
          "Parent category does not exist in this organization",
        );
      }
    }

    const slug = dto.slug || this.slugify(dto.name);
    return this.prisma.category.create({
      data: {
        organizationId,
        name: dto.name,
        slug,
        parentId: dto.parentId,
        description: dto.description,
        image: dto.image,
        status: dto.status || "ACTIVE",
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async updateCategory(
    id: string,
    organizationId: string,
    dto: UpdateCategoryDto,
  ) {
    await this.getCategoryById(id, organizationId);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException("Category cannot be its own parent");
      }

      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, organizationId, deletedAt: null },
      });

      if (!parent) {
        throw new BadRequestException(
          "Parent category does not exist in this organization",
        );
      }
    }

    const updateData: any = { ...dto };
    if (dto.name && !dto.slug) {
      updateData.slug = this.slugify(dto.name);
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async deleteCategory(id: string, organizationId: string) {
    await this.getCategoryById(id, organizationId);

    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

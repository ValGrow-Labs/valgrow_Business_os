import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Prisma } from "@prisma/client";

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  slugify(text: string): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async generateUniqueSlug(
    organizationId: string,
    baseSlug: string,
    excludeProductId?: string,
  ): Promise<string> {
    const existingProducts = await this.prisma.product.findMany({
      where: {
        organizationId,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
        OR: [
          { slug: baseSlug },
          { slug: { startsWith: `${baseSlug}-` } },
        ],
      },
      select: {
        slug: true,
      },
    });

    const existingSlugs = new Set(existingProducts.map((p) => p.slug));

    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let counter = 2;
    while (existingSlugs.has(`${baseSlug}-${counter}`)) {
      counter++;
    }

    return `${baseSlug}-${counter}`;
  }

  private isSlugConflict(error: any): boolean {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      if (Array.isArray(target)) {
        return target.some(
          (t: string) =>
            t === "slug" ||
            t.includes("slug") ||
            t.includes("Product_organizationId_slug_key"),
        );
      }
      if (typeof target === "string") {
        return (
          target.includes("slug") ||
          target.includes("Product_organizationId_slug_key")
        );
      }
      const modelName = (error.meta?.modelName as string) || "";
      if (!modelName || modelName === "Product") {
        return true;
      }
    }
    return false;
  }

  private async validateReferences(
    organizationId: string,
    refs: {
      categoryId?: string;
      brandId?: string;
      unitId?: string;
      taxId?: string;
    },
  ) {
    if (refs.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: refs.categoryId, organizationId, deletedAt: null },
      });
      if (!cat) {
        throw new BadRequestException(
          "Category does not exist in this organization",
        );
      }
    }

    if (refs.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: refs.brandId, organizationId, deletedAt: null },
      });
      if (!brand) {
        throw new BadRequestException(
          "Brand does not exist in this organization",
        );
      }
    }

    if (refs.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: refs.unitId, organizationId, deletedAt: null },
      });
      if (!unit) {
        throw new BadRequestException(
          "Unit of measure does not exist in this organization",
        );
      }
    }

    if (refs.taxId) {
      const tax = await this.prisma.tax.findFirst({
        where: { id: refs.taxId, organizationId, deletedAt: null },
      });
      if (!tax) {
        throw new BadRequestException(
          "Tax rate does not exist in this organization",
        );
      }
    }
  }

  async getProducts(organizationId: string, options: ProductQueryOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { sku: { contains: options.search, mode: "insensitive" } },
        { barcode: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    if (options.categoryId) where.categoryId = options.categoryId;
    if (options.brandId) where.brandId = options.brandId;
    if (options.status) where.status = options.status;
    if (options.type) where.type = options.type;

    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true, logo: true } },
          unit: {
            select: { id: true, name: true, code: true, allowDecimals: true },
          },
          tax: {
            select: { id: true, name: true, rate: true, isInclusive: true },
          },
          variants: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              attributes: true,
              status: true,
            },
          },
          prices: {
            select: {
              id: true,
              variantId: true,
              tier: true,
              price: true,
              minQuantity: true,
            },
          },
          stockLevels: {
            select: {
              onHand: true,
              reserved: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string, organizationId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        category: true,
        brand: true,
        unit: true,
        tax: true,
        variants: {
          where: { deletedAt: null },
        },
        prices: true,
      },
    });

    if (!product) {
      throw new NotFoundException("Product not found in this organization");
    }

    return product;
  }

  async createProduct(organizationId: string, dto: CreateProductDto) {
    await this.validateReferences(organizationId, {
      categoryId: dto.categoryId,
      brandId: dto.brandId,
      unitId: dto.unitId,
      taxId: dto.taxId,
    });

    const name = dto.name.trim();
    const rawSlug = dto.slug?.trim() || name;
    const baseSlug = this.slugify(rawSlug) || "product";

    const costPrice =
      dto.costPrice !== undefined
        ? new Prisma.Decimal(dto.costPrice)
        : new Prisma.Decimal(0);

    const maxRetries = 10;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const slug = await this.generateUniqueSlug(organizationId, baseSlug);
      try {
        return await this.prisma.product.create({
          data: {
            organizationId,
            name,
            slug,
            sku: dto.sku,
            barcode: dto.barcode,
            description: dto.description,
            categoryId: dto.categoryId,
            brandId: dto.brandId,
            unitId: dto.unitId,
            taxId: dto.taxId,
            type: dto.type || "PHYSICAL",
            status: dto.status || "ACTIVE",
            costPrice,
            hasVariants: dto.hasVariants ?? false,
            images: dto.images,
          },
          include: {
            category: true,
            brand: true,
            unit: true,
            tax: true,
          },
        });
      } catch (error) {
        if (this.isSlugConflict(error)) {
          if (attempt === maxRetries) {
            throw new BadRequestException(
              "Could not generate a unique product slug due to concurrent requests. Please try again.",
            );
          }
          await new Promise((resolve) =>
            setTimeout(resolve, Math.floor(Math.random() * 30) + 10),
          );
          continue;
        }
        throw error;
      }
    }
  }

  async updateProduct(
    id: string,
    organizationId: string,
    dto: UpdateProductDto,
  ) {
    const product = await this.getProductById(id, organizationId);

    await this.validateReferences(organizationId, {
      categoryId: dto.categoryId,
      brandId: dto.brandId,
      unitId: dto.unitId,
      taxId: dto.taxId,
    });

    const updateData: any = { ...dto };
    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }

    if (dto.costPrice !== undefined) {
      updateData.costPrice = new Prisma.Decimal(dto.costPrice);
    }

    const shouldUpdateSlug =
      dto.slug !== undefined ||
      (dto.name !== undefined && dto.name.trim() !== product.name);

    const maxRetries = 10;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (shouldUpdateSlug) {
        const rawSlug =
          dto.slug?.trim() || dto.name?.trim() || product.name;
        const baseSlug = this.slugify(rawSlug) || "product";
        updateData.slug = await this.generateUniqueSlug(
          organizationId,
          baseSlug,
          id,
        );
      }

      try {
        return await this.prisma.product.update({
          where: { id },
          data: updateData,
          include: {
            category: true,
            brand: true,
            unit: true,
            tax: true,
          },
        });
      } catch (error) {
        if (this.isSlugConflict(error) && shouldUpdateSlug) {
          if (attempt === maxRetries) {
            throw new BadRequestException(
              "Could not generate a unique product slug due to concurrent requests. Please try again.",
            );
          }
          await new Promise((resolve) =>
            setTimeout(resolve, Math.floor(Math.random() * 30) + 10),
          );
          continue;
        }
        throw error;
      }
    }
  }

  async deleteProduct(id: string, organizationId: string) {
    await this.getProductById(id, organizationId);

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

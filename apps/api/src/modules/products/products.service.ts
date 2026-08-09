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

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

    const slug = dto.slug || this.slugify(dto.name);
    return this.prisma.product.create({
      data: {
        organizationId,
        name: dto.name,
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
        costPrice:
          dto.costPrice !== undefined
            ? new Prisma.Decimal(dto.costPrice)
            : new Prisma.Decimal(0),
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
  }

  async updateProduct(
    id: string,
    organizationId: string,
    dto: UpdateProductDto,
  ) {
    await this.getProductById(id, organizationId);

    await this.validateReferences(organizationId, {
      categoryId: dto.categoryId,
      brandId: dto.brandId,
      unitId: dto.unitId,
      taxId: dto.taxId,
    });

    const updateData: any = { ...dto };
    if (dto.name && !dto.slug) {
      updateData.slug = this.slugify(dto.name);
    }

    if (dto.costPrice !== undefined) {
      updateData.costPrice = new Prisma.Decimal(dto.costPrice);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        brand: true,
        unit: true,
        tax: true,
      },
    });
  }

  async deleteProduct(id: string, organizationId: string) {
    await this.getProductById(id, organizationId);

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

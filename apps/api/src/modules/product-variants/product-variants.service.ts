import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { UpdateVariantDto } from "./dto/update-variant.dto";

@Injectable()
export class ProductVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProduct(productId: string, organizationId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException("Product not found in this organization");
    }

    return product;
  }

  async getVariants(productId: string, organizationId: string) {
    await this.verifyProduct(productId, organizationId);

    return this.prisma.productVariant.findMany({
      where: {
        productId,
        organizationId,
        deletedAt: null,
      },
      include: {
        prices: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getVariantById(id: string, productId: string, organizationId: string) {
    await this.verifyProduct(productId, organizationId);

    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id,
        productId,
        organizationId,
        deletedAt: null,
      },
      include: {
        prices: true,
      },
    });

    if (!variant) {
      throw new NotFoundException("Product variant not found");
    }

    return variant;
  }

  async createVariant(
    productId: string,
    organizationId: string,
    dto: CreateVariantDto,
  ) {
    await this.verifyProduct(productId, organizationId);

    // Check SKU uniqueness within organization
    const existingSku = await this.prisma.productVariant.findFirst({
      where: { organizationId, sku: dto.sku, deletedAt: null },
    });
    if (existingSku) {
      throw new BadRequestException(
        `SKU '${dto.sku}' is already in use in this organization`,
      );
    }

    if (dto.barcode) {
      const existingBarcode = await this.prisma.productVariant.findFirst({
        where: { organizationId, barcode: dto.barcode, deletedAt: null },
      });
      if (existingBarcode) {
        throw new BadRequestException(
          `Barcode '${dto.barcode}' is already in use in this organization`,
        );
      }
    }

    const variant = await this.prisma.productVariant.create({
      data: {
        organizationId,
        productId,
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        attributes: dto.attributes,
        status: dto.status || "ACTIVE",
      },
    });

    // Mark parent product as having variants
    await this.prisma.product.update({
      where: { id: productId },
      data: { hasVariants: true },
    });

    return variant;
  }

  async updateVariant(
    id: string,
    productId: string,
    organizationId: string,
    dto: UpdateVariantDto,
  ) {
    await this.getVariantById(id, productId, organizationId);

    if (dto.sku) {
      const existingSku = await this.prisma.productVariant.findFirst({
        where: {
          organizationId,
          sku: dto.sku,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingSku) {
        throw new BadRequestException(
          `SKU '${dto.sku}' is already in use in this organization`,
        );
      }
    }

    if (dto.barcode) {
      const existingBarcode = await this.prisma.productVariant.findFirst({
        where: {
          organizationId,
          barcode: dto.barcode,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingBarcode) {
        throw new BadRequestException(
          `Barcode '${dto.barcode}' is already in use in this organization`,
        );
      }
    }

    return this.prisma.productVariant.update({
      where: { id },
      data: dto,
    });
  }

  async deleteVariant(id: string, productId: string, organizationId: string) {
    await this.getVariantById(id, productId, organizationId);

    return this.prisma.productVariant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

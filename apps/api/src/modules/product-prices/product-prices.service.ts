import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePriceDto } from "./dto/create-price.dto";
import { UpdatePriceDto } from "./dto/update-price.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductPricesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyProductAndVariant(
    productId: string,
    organizationId: string,
    variantId?: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException("Product not found in this organization");
    }

    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, organizationId, deletedAt: null },
      });

      if (!variant) {
        throw new BadRequestException(
          "Variant does not exist in this organization",
        );
      }

      if (variant.productId !== productId) {
        throw new BadRequestException(
          "Variant does not belong to the specified product",
        );
      }
    }

    return product;
  }

  async getPrices(productId: string, organizationId: string) {
    await this.verifyProductAndVariant(productId, organizationId);

    return this.prisma.productPrice.findMany({
      where: {
        productId,
        organizationId,
      },
      include: {
        variant: {
          select: { id: true, name: true, sku: true },
        },
      },
      orderBy: [{ tier: "asc" }, { minQuantity: "asc" }],
    });
  }

  async createPrice(
    productId: string,
    organizationId: string,
    dto: CreatePriceDto,
  ) {
    await this.verifyProductAndVariant(
      productId,
      organizationId,
      dto.variantId,
    );

    return this.prisma.productPrice.create({
      data: {
        organizationId,
        productId,
        variantId: dto.variantId || null,
        tier: dto.tier || "RETAIL",
        price: new Prisma.Decimal(dto.price),
        minQuantity: dto.minQuantity ?? 1,
      },
      include: {
        variant: {
          select: { id: true, name: true, sku: true },
        },
      },
    });
  }

  async updatePrice(
    id: string,
    productId: string,
    organizationId: string,
    dto: UpdatePriceDto,
  ) {
    const existing = await this.prisma.productPrice.findFirst({
      where: { id, productId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException("Product price level not found");
    }

    const variantId =
      dto.variantId !== undefined
        ? dto.variantId
        : existing.variantId || undefined;
    await this.verifyProductAndVariant(productId, organizationId, variantId);

    const updateData: any = { ...dto };
    if (dto.price !== undefined) {
      updateData.price = new Prisma.Decimal(dto.price);
    }

    return this.prisma.productPrice.update({
      where: { id },
      data: updateData,
      include: {
        variant: {
          select: { id: true, name: true, sku: true },
        },
      },
    });
  }

  async deletePrice(id: string, productId: string, organizationId: string) {
    const existing = await this.prisma.productPrice.findFirst({
      where: { id, productId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException("Product price level not found");
    }

    return this.prisma.productPrice.delete({
      where: { id },
    });
  }
}

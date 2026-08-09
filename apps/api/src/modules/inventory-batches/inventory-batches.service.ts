import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { UpdateBatchDto } from "./dto/update-batch.dto";
import { Prisma } from "@prisma/client";

export interface BatchQueryOptions {
  productId?: string;
  variantId?: string;
  expired?: boolean;
  expiringSoonDays?: number;
}

@Injectable()
export class InventoryBatchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateProductAndVariant(
    organizationId: string,
    productId: string,
    variantId?: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId, deletedAt: null },
    });

    if (!product) {
      throw new BadRequestException(
        "Product does not exist in this organization",
      );
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
  }

  async getBatches(organizationId: string, options: BatchQueryOptions = {}) {
    const where: any = { organizationId };

    if (options.productId) where.productId = options.productId;
    if (options.variantId) where.variantId = options.variantId;

    const now = new Date();
    if (options.expired) {
      where.expiryDate = { lt: now };
    } else if (options.expiringSoonDays) {
      const soon = new Date();
      soon.setDate(soon.getDate() + Number(options.expiringSoonDays));
      where.expiryDate = { gte: now, lte: soon };
    }

    return this.prisma.inventoryBatch.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  async getBatchById(id: string, organizationId: string) {
    const batch = await this.prisma.inventoryBatch.findFirst({
      where: { id, organizationId },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(
        "Inventory batch not found in this organization",
      );
    }

    return batch;
  }

  async createBatch(organizationId: string, dto: CreateBatchDto) {
    await this.validateProductAndVariant(
      organizationId,
      dto.productId,
      dto.variantId,
    );

    const existing = await this.prisma.inventoryBatch.findFirst({
      where: {
        organizationId,
        productId: dto.productId,
        variantId: dto.variantId || null,
        batchNumber: dto.batchNumber,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Batch number '${dto.batchNumber}' already exists for this product in your organization`,
      );
    }

    return this.prisma.inventoryBatch.create({
      data: {
        organizationId,
        productId: dto.productId,
        variantId: dto.variantId || null,
        batchNumber: dto.batchNumber,
        manufactureDate: dto.manufactureDate
          ? new Date(dto.manufactureDate)
          : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        costPrice: new Prisma.Decimal(dto.costPrice),
      },
      include: {
        product: { select: { id: true, name: true } },
        variant: { select: { id: true, name: true } },
      },
    });
  }

  async updateBatch(id: string, organizationId: string, dto: UpdateBatchDto) {
    const existing = await this.getBatchById(id, organizationId);

    const productId = dto.productId || existing.productId;
    const variantId =
      dto.variantId !== undefined
        ? dto.variantId
        : existing.variantId || undefined;

    await this.validateProductAndVariant(organizationId, productId, variantId);

    const updateData: any = { ...dto };
    if (dto.costPrice !== undefined) {
      updateData.costPrice = new Prisma.Decimal(dto.costPrice);
    }
    if (dto.manufactureDate !== undefined) {
      updateData.manufactureDate = dto.manufactureDate
        ? new Date(dto.manufactureDate)
        : null;
    }
    if (dto.expiryDate !== undefined) {
      updateData.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    }

    return this.prisma.inventoryBatch.update({
      where: { id },
      data: updateData,
      include: {
        product: { select: { id: true, name: true } },
        variant: { select: { id: true, name: true } },
      },
    });
  }
}

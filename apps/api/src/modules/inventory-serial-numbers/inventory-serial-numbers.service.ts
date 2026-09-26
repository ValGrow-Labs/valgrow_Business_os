import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSerialDto } from "./dto/create-serial.dto";
import { UpdateSerialDto } from "./dto/update-serial.dto";

@Injectable()
export class InventorySerialNumbersService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateReferences(
    organizationId: string,
    refs: {
      productId: string;
      variantId?: string;
      batchId?: string;
      locationId: string;
    },
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: refs.productId, organizationId, deletedAt: null },
    });
    if (!product) {
      throw new BadRequestException(
        "Product does not exist in this organization",
      );
    }

    if (refs.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: refs.variantId, organizationId, deletedAt: null },
      });
      if (!variant) {
        throw new BadRequestException(
          "Variant does not exist in this organization",
        );
      }
      if (variant.productId !== refs.productId) {
        throw new BadRequestException(
          "Variant does not belong to the specified product",
        );
      }
    }

    if (refs.batchId) {
      const batch = await this.prisma.inventoryBatch.findFirst({
        where: { id: refs.batchId, organizationId },
      });
      if (!batch) {
        throw new BadRequestException(
          "Batch does not exist in this organization",
        );
      }
    }

    const location = await this.prisma.location.findFirst({
      where: { id: refs.locationId, organizationId, deletedAt: null },
    });
    if (!location) {
      throw new BadRequestException(
        "Location does not exist in this organization",
      );
    }
  }

  async getSerialNumbers(
    organizationId: string,
    productId?: string,
    status?: string,
  ) {
    const where: any = { organizationId };
    if (productId) where.productId = productId;
    if (status) where.status = status;

    return this.prisma.inventorySerialNumber.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
        location: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSerialById(id: string, organizationId: string) {
    const serial = await this.prisma.inventorySerialNumber.findFirst({
      where: { id, organizationId },
      include: {
        product: true,
        variant: true,
        location: true,
        movements: true,
      },
    });

    if (!serial) {
      throw new NotFoundException(
        "Serial number not found in this organization",
      );
    }

    return serial;
  }

  async createSerial(organizationId: string, dto: CreateSerialDto) {
    await this.validateReferences(organizationId, {
      productId: dto.productId,
      variantId: dto.variantId,
      batchId: dto.batchId,
      locationId: dto.locationId,
    });

    const existing = await this.prisma.inventorySerialNumber.findFirst({
      where: { organizationId, serialNumber: dto.serialNumber },
    });

    if (existing) {
      throw new BadRequestException(
        `Serial number '${dto.serialNumber}' is already registered in this organization`,
      );
    }

    return this.prisma.inventorySerialNumber.create({
      data: {
        organizationId,
        productId: dto.productId,
        variantId: dto.variantId || null,
        batchId: dto.batchId || null,
        locationId: dto.locationId,
        serialNumber: dto.serialNumber,
        status: dto.status || "AVAILABLE",
      },
      include: {
        product: { select: { id: true, name: true } },
        variant: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });
  }

  async updateSerial(id: string, organizationId: string, dto: UpdateSerialDto) {
    const existing = await this.getSerialById(id, organizationId);

    const productId = dto.productId || existing.productId;
    const variantId =
      dto.variantId !== undefined
        ? dto.variantId
        : existing.variantId || undefined;
    const batchId =
      dto.batchId !== undefined ? dto.batchId : existing.batchId || undefined;
    const locationId = dto.locationId || existing.locationId;

    await this.validateReferences(organizationId, {
      productId,
      variantId,
      batchId,
      locationId,
    });

    if (dto.serialNumber) {
      const existingSn = await this.prisma.inventorySerialNumber.findFirst({
        where: {
          organizationId,
          serialNumber: dto.serialNumber,
          id: { not: id },
        },
      });
      if (existingSn) {
        throw new BadRequestException(
          `Serial number '${dto.serialNumber}' is already registered in this organization`,
        );
      }
    }

    return this.prisma.inventorySerialNumber.update({
      where: { id },
      data: dto,
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSerialDto } from "./dto/create-serial.dto";
import { UpdateSerialDto } from "./dto/update-serial.dto";

export interface SerialQueryOptions {
  productId?: string;
  status?: string;
  warehouseId?: string;
  locationId?: string;
  search?: string;
}

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
    options: SerialQueryOptions = {},
  ) {
    const where: any = { organizationId };

    if (options.productId) where.productId = options.productId;
    if (options.status && options.status !== "ALL") where.status = options.status;
    if (options.locationId) where.locationId = options.locationId;
    if (options.warehouseId) {
      where.location = { warehouseId: options.warehouseId };
    }

    if (options.search) {
      const term = options.search.trim();
      where.OR = [
        { serialNumber: { contains: term, mode: "insensitive" } },
        { product: { name: { contains: term, mode: "insensitive" } } },
        { product: { sku: { contains: term, mode: "insensitive" } } },
        { notes: { contains: term, mode: "insensitive" } },
      ];
    }

    const serials = await this.prisma.inventorySerialNumber.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
        location: {
          select: {
            id: true,
            name: true,
            code: true,
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
        salesOrder: { select: { id: true, orderNumber: true } },
        salesInvoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (options.search) {
      const termLower = options.search.trim().toLowerCase();
      serials.sort((a, b) => {
        const aExact = a.serialNumber.toLowerCase() === termLower ? 1 : 0;
        const bExact = b.serialNumber.toLowerCase() === termLower ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        return 0;
      });
    }

    return serials;
  }

  async getSerialById(id: string, organizationId: string) {
    const serial = await this.prisma.inventorySerialNumber.findFirst({
      where: { id, organizationId },
      include: {
        product: true,
        variant: true,
        location: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
        salesOrder: true,
        salesInvoice: true,
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
        warrantyEndDate: dto.warrantyEndDate ? new Date(dto.warrantyEndDate) : null,
        soldAt: dto.soldAt ? new Date(dto.soldAt) : null,
        salesOrderId: dto.salesOrderId || null,
        salesInvoiceId: dto.salesInvoiceId || null,
        notes: dto.notes || null,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
        location: {
          select: {
            id: true,
            name: true,
            code: true,
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
        salesOrder: { select: { id: true, orderNumber: true } },
        salesInvoice: { select: { id: true, invoiceNumber: true } },
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

    const updateData: any = { ...dto };
    if (dto.warrantyEndDate !== undefined) {
      updateData.warrantyEndDate = dto.warrantyEndDate
        ? new Date(dto.warrantyEndDate)
        : null;
    }
    if (dto.soldAt !== undefined) {
      updateData.soldAt = dto.soldAt ? new Date(dto.soldAt) : null;
    }

    return this.prisma.inventorySerialNumber.update({
      where: { id },
      data: updateData,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
        location: {
          select: {
            id: true,
            name: true,
            code: true,
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
        salesOrder: { select: { id: true, orderNumber: true } },
        salesInvoice: { select: { id: true, invoiceNumber: true } },
      },
    });
  }
}

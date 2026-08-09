import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class InventoryReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateReferences(
    organizationId: string,
    dto: {
      locationId: string;
      productId: string;
      variantId?: string;
      batchId?: string;
    },
  ) {
    const location = await this.prisma.location.findFirst({
      where: { id: dto.locationId, organizationId, deletedAt: null },
    });
    if (!location) {
      throw new BadRequestException(
        "Location does not exist in this organization",
      );
    }

    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, organizationId, deletedAt: null },
    });
    if (!product) {
      throw new BadRequestException(
        "Product does not exist in this organization",
      );
    }

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: dto.variantId, organizationId, deletedAt: null },
      });
      if (!variant) {
        throw new BadRequestException(
          "Variant does not exist in this organization",
        );
      }
      if (variant.productId !== dto.productId) {
        throw new BadRequestException(
          "Variant does not belong to the specified product",
        );
      }
    }

    if (dto.batchId) {
      const batch = await this.prisma.inventoryBatch.findFirst({
        where: { id: dto.batchId, organizationId },
      });
      if (!batch) {
        throw new BadRequestException(
          "Batch does not exist in this organization",
        );
      }
    }
  }

  async getReservations(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;

    return this.prisma.stockReservation.findMany({
      where,
      include: {
        location: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getReservationById(id: string, organizationId: string) {
    const reservation = await this.prisma.stockReservation.findFirst({
      where: { id, organizationId },
      include: { location: true },
    });

    if (!reservation) {
      throw new NotFoundException(
        "Stock reservation not found in this organization",
      );
    }

    return reservation;
  }

  async createReservation(organizationId: string, dto: CreateReservationDto) {
    await this.validateReferences(organizationId, dto);

    const qtyDecimal = new Prisma.Decimal(dto.quantity);

    return this.prisma.$transaction(async (tx) => {
      // 1. Find StockLevel
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          organizationId,
          locationId: dto.locationId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          batchId: dto.batchId || null,
        },
      });

      const currentOnHand = stockLevel
        ? stockLevel.onHand
        : new Prisma.Decimal(0);
      const currentReserved = stockLevel
        ? stockLevel.reserved
        : new Prisma.Decimal(0);
      const currentAvailable = currentOnHand.sub(currentReserved);

      if (currentAvailable.lt(qtyDecimal)) {
        throw new BadRequestException(
          `Insufficient available stock (${currentAvailable}) for reservation (${qtyDecimal})`,
        );
      }

      // 2. Increment reserved on StockLevel
      if (stockLevel) {
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            reserved: currentReserved.add(qtyDecimal),
            version: { increment: 1 },
          },
        });
      }

      // 3. Create Reservation record
      return tx.stockReservation.create({
        data: {
          organizationId,
          locationId: dto.locationId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          batchId: dto.batchId || null,
          quantity: qtyDecimal,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          expiresAt: new Date(dto.expiresAt),
          status: "ACTIVE",
        },
      });
    });
  }

  async fulfillReservation(id: string, organizationId: string) {
    const reservation = await this.getReservationById(id, organizationId);
    if (reservation.status !== "ACTIVE") {
      throw new BadRequestException(
        `Reservation is ${reservation.status} and cannot be fulfilled`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          organizationId,
          locationId: reservation.locationId,
          productId: reservation.productId,
          variantId: reservation.variantId || null,
          batchId: reservation.batchId || null,
        },
      });

      if (stockLevel) {
        const newReserved = stockLevel.reserved.sub(reservation.quantity);
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            reserved: newReserved.isNegative()
              ? new Prisma.Decimal(0)
              : newReserved,
            version: { increment: 1 },
          },
        });
      }

      return tx.stockReservation.update({
        where: { id },
        data: { status: "FULFILLED" },
      });
    });
  }

  async cancelReservation(id: string, organizationId: string) {
    const reservation = await this.getReservationById(id, organizationId);
    if (reservation.status !== "ACTIVE") {
      throw new BadRequestException(
        `Reservation is ${reservation.status} and cannot be cancelled`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          organizationId,
          locationId: reservation.locationId,
          productId: reservation.productId,
          variantId: reservation.variantId || null,
          batchId: reservation.batchId || null,
        },
      });

      if (stockLevel) {
        const newReserved = stockLevel.reserved.sub(reservation.quantity);
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            reserved: newReserved.isNegative()
              ? new Prisma.Decimal(0)
              : newReserved,
            version: { increment: 1 },
          },
        });
      }

      return tx.stockReservation.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    });
  }
}

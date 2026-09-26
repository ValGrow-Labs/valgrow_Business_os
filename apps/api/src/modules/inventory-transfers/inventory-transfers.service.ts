import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { UpdateTransferDto } from "./dto/update-transfer.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class InventoryTransfersService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateTransferSetup(
    organizationId: string,
    dto: CreateTransferDto,
  ) {
    if (dto.sourceWarehouseId === dto.destWarehouseId) {
      throw new BadRequestException(
        "Source warehouse and destination warehouse must be different",
      );
    }

    const sourceWh = await this.prisma.warehouse.findFirst({
      where: { id: dto.sourceWarehouseId, organizationId, deletedAt: null },
    });
    if (!sourceWh) {
      throw new BadRequestException(
        "Source warehouse does not exist in this organization",
      );
    }

    const destWh = await this.prisma.warehouse.findFirst({
      where: { id: dto.destWarehouseId, organizationId, deletedAt: null },
    });
    if (!destWh) {
      throw new BadRequestException(
        "Destination warehouse does not exist in this organization",
      );
    }

    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, organizationId, deletedAt: null },
      });
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} does not exist in this organization`,
        );
      }

      if (item.variantId) {
        const variant = await this.prisma.productVariant.findFirst({
          where: { id: item.variantId, organizationId, deletedAt: null },
        });
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.variantId} does not exist in this organization`,
          );
        }
        if (variant.productId !== item.productId) {
          throw new BadRequestException(
            `Variant ${item.variantId} does not belong to product ${item.productId}`,
          );
        }
      }

      const srcLoc = await this.prisma.location.findFirst({
        where: {
          id: item.sourceLocationId,
          warehouseId: dto.sourceWarehouseId,
          organizationId,
          deletedAt: null,
        },
      });
      if (!srcLoc) {
        throw new BadRequestException(
          `Source location ${item.sourceLocationId} does not belong to source warehouse`,
        );
      }

      const destLoc = await this.prisma.location.findFirst({
        where: {
          id: item.destLocationId,
          warehouseId: dto.destWarehouseId,
          organizationId,
          deletedAt: null,
        },
      });
      if (!destLoc) {
        throw new BadRequestException(
          `Destination location ${item.destLocationId} does not belong to destination warehouse`,
        );
      }
    }
  }

  async getTransfers(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;

    return this.prisma.stockTransfer.findMany({
      where,
      include: {
        sourceWarehouse: { select: { id: true, name: true, code: true } },
        destWarehouse: { select: { id: true, name: true, code: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTransferById(id: string, organizationId: string) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, organizationId },
      include: {
        sourceWarehouse: true,
        destWarehouse: true,
        items: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException(
        "Stock transfer not found in this organization",
      );
    }

    return transfer;
  }

  async createTransfer(
    organizationId: string,
    createdById: string,
    dto: CreateTransferDto,
  ) {
    await this.validateTransferSetup(organizationId, dto);

    const existingNum = await this.prisma.stockTransfer.findFirst({
      where: { organizationId, transferNumber: dto.transferNumber },
    });
    if (existingNum) {
      throw new BadRequestException(
        `Transfer number '${dto.transferNumber}' is already in use`,
      );
    }

    return this.prisma.stockTransfer.create({
      data: {
        organizationId,
        transferNumber: dto.transferNumber,
        sourceWarehouseId: dto.sourceWarehouseId,
        destWarehouseId: dto.destWarehouseId,
        notes: dto.notes,
        createdById,
        status: "DRAFT",
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || null,
            batchId: i.batchId || null,
            sourceLocationId: i.sourceLocationId,
            destLocationId: i.destLocationId,
            requestedQty: new Prisma.Decimal(i.requestedQty),
          })),
        },
      },
      include: { items: true },
    });
  }

  async updateTransfer(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateTransferDto,
  ) {
    const transfer = await this.getTransferById(id, organizationId);

    if (transfer.status === "COMPLETED" || transfer.status === "CANCELLED") {
      throw new BadRequestException(
        `Transfer is already ${transfer.status} and cannot be modified`,
      );
    }

    // Process completion atomically in transaction
    if (dto.status === "COMPLETED") {
      return this.prisma.$transaction(async (tx) => {
        // 1. Process items: create TRANSFER_OUT and TRANSFER_IN movements
        for (const item of transfer.items) {
          const qty = item.requestedQty;
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          const unitCost = product ? product.costPrice : new Prisma.Decimal(0);

          // TRANSFER_OUT from source location
          const srcStock = await tx.stockLevel.findFirst({
            where: {
              organizationId,
              locationId: item.sourceLocationId,
              productId: item.productId,
              variantId: item.variantId || null,
              batchId: item.batchId || null,
            },
          });

          const currentSrcOnHand = srcStock
            ? srcStock.onHand
            : new Prisma.Decimal(0);
          const currentSrcReserved = srcStock
            ? srcStock.reserved
            : new Prisma.Decimal(0);
          const currentSrcAvailable = currentSrcOnHand.sub(currentSrcReserved);

          if (currentSrcAvailable.lt(qty)) {
            throw new BadRequestException(
              `Insufficient stock at source location for product ${item.productId}`,
            );
          }

          // Deduct source
          await tx.stockLevel.update({
            where: { id: srcStock!.id },
            data: {
              onHand: currentSrcOnHand.sub(qty),
              version: { increment: 1 },
            },
          });

          await tx.stockMovement.create({
            data: {
              organizationId,
              warehouseId: transfer.sourceWarehouseId,
              locationId: item.sourceLocationId,
              productId: item.productId,
              variantId: item.variantId || null,
              batchId: item.batchId || null,
              movementType: "TRANSFER_OUT",
              quantity: qty.negated(),
              unitCost,
              totalCost: qty.mul(unitCost),
              referenceType: "STOCK_TRANSFER",
              referenceId: transfer.id,
              actorId,
              notes: `Transfer OUT to Warehouse ${transfer.destWarehouseId}`,
            },
          });

          // TRANSFER_IN to destination location
          const destStock = await tx.stockLevel.findFirst({
            where: {
              organizationId,
              locationId: item.destLocationId,
              productId: item.productId,
              variantId: item.variantId || null,
              batchId: item.batchId || null,
            },
          });

          const currentDestOnHand = destStock
            ? destStock.onHand
            : new Prisma.Decimal(0);
          const newDestOnHand = currentDestOnHand.add(qty);

          if (destStock) {
            await tx.stockLevel.update({
              where: { id: destStock.id },
              data: { onHand: newDestOnHand, version: { increment: 1 } },
            });
          } else {
            await tx.stockLevel.create({
              data: {
                organizationId,
                warehouseId: transfer.destWarehouseId,
                locationId: item.destLocationId,
                productId: item.productId,
                variantId: item.variantId || null,
                batchId: item.batchId || null,
                onHand: newDestOnHand,
                reserved: new Prisma.Decimal(0),
              },
            });
          }

          await tx.stockMovement.create({
            data: {
              organizationId,
              warehouseId: transfer.destWarehouseId,
              locationId: item.destLocationId,
              productId: item.productId,
              variantId: item.variantId || null,
              batchId: item.batchId || null,
              movementType: "TRANSFER_IN",
              quantity: qty,
              unitCost,
              totalCost: qty.mul(unitCost),
              referenceType: "STOCK_TRANSFER",
              referenceId: transfer.id,
              actorId,
              notes: `Transfer IN from Warehouse ${transfer.sourceWarehouseId}`,
            },
          });

          // Create Inbound Cost Layer for destination
          await tx.inventoryCostLayer.create({
            data: {
              organizationId,
              warehouseId: transfer.destWarehouseId,
              locationId: item.destLocationId,
              productId: item.productId,
              variantId: item.variantId || null,
              batchId: item.batchId || null,
              initialQty: qty,
              remainingQty: qty,
              unitCost,
              status: "ACTIVE",
            },
          });

          await tx.stockTransferItem.update({
            where: { id: item.id },
            data: { shippedQty: qty, receivedQty: qty },
          });
        }

        return tx.stockTransfer.update({
          where: { id },
          data: { status: "COMPLETED", receivedAt: new Date() },
          include: { items: true },
        });
      });
    }

    return this.prisma.stockTransfer.update({
      where: { id },
      data: dto,
      include: { items: true },
    });
  }
}

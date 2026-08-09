import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateLandedCostDto } from "./dto/create-landed-cost.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class LandedCostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLandedCosts(organizationId: string) {
    return this.prisma.landedCostAllocation.findMany({
      where: { organizationId },
      include: {
        goodsReceipt: {
          select: { id: true, receiptNumber: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLandedCostById(id: string, organizationId: string) {
    const lc = await this.prisma.landedCostAllocation.findFirst({
      where: { id, organizationId },
      include: {
        goodsReceipt: { include: { items: true } },
      },
    });
    if (!lc) throw new NotFoundException("Landed cost not found");
    return lc;
  }

  async createLandedCost(organizationId: string, dto: CreateLandedCostDto) {
    const grn = await this.prisma.goodsReceipt.findFirst({
      where: { id: dto.goodsReceiptId, organizationId },
      include: { items: true },
    });
    if (!grn)
      throw new BadRequestException(
        "Goods receipt not found in this organization",
      );
    if (grn.status !== "POSTED") {
      throw new BadRequestException(
        "Landed cost can only be allocated to POSTED goods receipts",
      );
    }

    const totalReceived = grn.items.reduce(
      (sum, i) => sum.add(i.receivedQty.mul(i.unitCost)),
      new Prisma.Decimal(0),
    );

    if (totalReceived.isZero()) {
      throw new BadRequestException(
        "Cannot allocate landed cost: total received value is zero",
      );
    }

    const amount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(async (tx) => {
      // Create the landed cost allocation
      const lc = await tx.landedCostAllocation.create({
        data: {
          organizationId,
          goodsReceiptId: dto.goodsReceiptId,
          costType: dto.costType,
          amount,
          notes: dto.notes,
        },
      });

      // Allocate proportionally across GRN items and update cost layers
      for (const item of grn.items) {
        const itemValue = item.receivedQty.mul(item.unitCost);
        const proportion = itemValue.div(totalReceived);
        const allocatedAmount = amount.mul(proportion);
        const landedCostPerUnit = item.receivedQty.isZero()
          ? new Prisma.Decimal(0)
          : allocatedAmount.div(item.receivedQty);

        // Update the cost layer for this item
        const costLayer = await tx.inventoryCostLayer.findFirst({
          where: {
            organizationId,
            productId: item.productId,
            variantId: item.variantId || null,
            warehouseId: grn.warehouseId,
            locationId: item.locationId,
          },
          orderBy: { createdAt: "desc" },
        });

        if (costLayer) {
          const currentBase = costLayer.baseUnitCost || new Prisma.Decimal(0);
          const currentLanded =
            costLayer.landedCostPerUnit || new Prisma.Decimal(0);
          const newLanded = currentLanded.add(landedCostPerUnit);
          const newUnitCost = currentBase.add(newLanded);
          await tx.inventoryCostLayer.update({
            where: { id: costLayer.id },
            data: {
              landedCostPerUnit: newLanded,
              unitCost: newUnitCost,
            },
          });
        }
      }

      return lc;
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SalesReturnsService } from "../../sales-returns/sales-returns.service";
import { PosRefundDto } from "../dto/checkout.dto";

@Injectable()
export class PosRefundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesReturnsService: SalesReturnsService,
  ) {}

  async refundPOSSale(
    organizationId: string,
    actorId: string,
    saleId: string,
    dto: PosRefundDto,
  ) {
    const sale = await this.prisma.pOSSale.findFirst({
      where: { id: saleId, organizationId },
      include: {
        salesOrder: { include: { items: true } },
        salesInvoice: true,
        customer: true,
      },
    });

    if (!sale) throw new NotFoundException("POS Sale not found");
    if (sale.status === "REFUNDED") {
      throw new BadRequestException("POS Sale has already been fully refunded");
    }

    if (!sale.salesOrder) {
      throw new BadRequestException(
        "No underlying Sales Order attached to POS Sale",
      );
    }

    // Default location in warehouse
    const defaultLocation = await this.prisma.location.findFirst({
      where: { warehouseId: sale.warehouseId, organizationId, deletedAt: null },
    });
    if (!defaultLocation) {
      throw new BadRequestException("Warehouse default bin location not found");
    }

    // Items to return
    const returnItems =
      dto.items && dto.items.length > 0
        ? dto.items
        : sale.salesOrder.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || undefined,
            locationId: defaultLocation.id,
            originalQty: Number(i.orderedQty),
            returnedQty: Number(i.orderedQty),
            reason: "CUSTOMER_CHANGED_MIND" as const,
            refundAmount: Number(i.totalAmount),
          }));

    // Reuse SalesReturnsService to create and post return
    const draftReturn = await this.salesReturnsService.createSalesReturn(
      organizationId,
      {
        customerId: sale.customerId || sale.salesOrder.customerId,
        warehouseId: sale.warehouseId,
        salesOrderId: sale.salesOrderId || undefined,
        salesInvoiceId: sale.salesInvoiceId || undefined,
        notes: dto.notes || `POS Refund for receipt ${sale.receiptNumber}`,
        items: returnItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          locationId: i.locationId || defaultLocation.id,
          originalQty: (i as any).originalQty || (i as any).returnedQty || 1,
          returnedQty: (i as any).returnedQty || 1,
          reason: "CUSTOMER_CHANGED_MIND",
          refundAmount: (i as any).refundAmount || 0,
        })),
      },
    );

    // Post return to restock items
    const postedReturn = await this.salesReturnsService.postSalesReturn(
      draftReturn.id,
      organizationId,
      actorId,
    );

    // Update POSSale status to REFUNDED
    await this.prisma.pOSSale.update({
      where: { id: saleId },
      data: { status: "REFUNDED" },
    });

    return {
      saleId,
      receiptNumber: sale.receiptNumber,
      salesReturn: postedReturn,
    };
  }
}

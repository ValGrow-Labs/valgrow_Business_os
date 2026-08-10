import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { JournalEntriesService } from "../../journal-entries/journal-entries.service";
import { PosCheckoutDto } from "../dto/checkout.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class PosCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  private async generateReceiptNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "POS",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "POS", year, lastSequence: 1 },
    });
    return `POS-${year}-${String(seq.lastSequence).padStart(6, "0")}`;
  }

  private async generateSONumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "SO",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "SO", year, lastSequence: 1 },
    });
    return `SO-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async generateINVNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "INV",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "INV", year, lastSequence: 1 },
    });
    return `INV-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async generatePAYNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "PAY",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "PAY", year, lastSequence: 1 },
    });
    return `PAY-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async generateDNNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "DN",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "DN", year, lastSequence: 1 },
    });
    return `DN-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  async checkout(
    organizationId: string,
    cashierId: string,
    dto: PosCheckoutDto,
  ) {
    if (!dto.payments || dto.payments.length === 0) {
      throw new BadRequestException("At least one payment method is required");
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate POS Session
      const session = await tx.pOSSession.findFirst({
        where: { id: dto.sessionId, organizationId, status: "OPEN" },
      });
      if (!session) {
        throw new BadRequestException("Active OPEN POS session not found");
      }

      // 2. Validate POS Cart & Items
      const cart = await tx.pOSCart.findFirst({
        where: { id: dto.cartId, organizationId, sessionId: dto.sessionId },
        include: {
          items: {
            include: { product: true, variant: true },
          },
          customer: true,
        },
      });
      if (!cart) throw new NotFoundException("POS Cart not found");
      if (cart.status !== "ACTIVE" && cart.status !== "HELD") {
        throw new BadRequestException(`Cannot checkout a ${cart.status} cart`);
      }
      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException("POS Cart is empty");
      }

      const customerId = dto.customerId || cart.customerId;
      if (customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: customerId, organizationId, deletedAt: null },
        });
        if (!customer) throw new BadRequestException("Customer not found");
      }

      // Find default bin location in warehouse
      const defaultLocation = await tx.location.findFirst({
        where: {
          warehouseId: session.warehouseId,
          organizationId,
          deletedAt: null,
        },
      });
      if (!defaultLocation) {
        throw new BadRequestException(
          `No location bin configured for warehouse ${session.warehouseId}`,
        );
      }

      // 3. Stock Validation & Price Calculation (server-authoritative)
      let subtotalAmount = new Prisma.Decimal(0);
      let itemDiscountsTotal = new Prisma.Decimal(0);
      let taxAmountTotal = new Prisma.Decimal(0);

      for (const item of cart.items) {
        const qty = item.quantity;

        // Fetch stock level
        const stockLevel = await tx.stockLevel.findFirst({
          where: {
            organizationId,
            warehouseId: session.warehouseId,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });

        const available = stockLevel
          ? stockLevel.onHand.sub(stockLevel.reserved)
          : new Prisma.Decimal(0);

        if (qty.gt(available)) {
          throw new BadRequestException(
            `Insufficient available stock for ${item.product.name}${
              item.variant ? ` (${item.variant.name})` : ""
            }. Requested: ${qty}, Available: ${available}`,
          );
        }

        const lineSub = qty.mul(item.unitPrice);
        subtotalAmount = subtotalAmount.add(lineSub);
        itemDiscountsTotal = itemDiscountsTotal.add(item.discountAmount);
        taxAmountTotal = taxAmountTotal.add(item.taxAmount);
      }

      // Cart-level discount
      const cartDiscount = new Prisma.Decimal(dto.cartDiscountAmount || 0);
      const totalDiscountAmount = itemDiscountsTotal.add(cartDiscount);

      const netSubtotal = subtotalAmount.sub(totalDiscountAmount);
      if (netSubtotal.isNegative()) {
        throw new BadRequestException("Total discount exceeds subtotal amount");
      }

      const grandTotalAmount = netSubtotal.add(taxAmountTotal);

      // 4. Payment Amount & Split Payment Validation
      let totalPaidAmount = new Prisma.Decimal(0);
      let totalCashReceived = new Prisma.Decimal(0);
      let totalChangeAmount = new Prisma.Decimal(0);

      for (const p of dto.payments) {
        const amt = new Prisma.Decimal(p.amount);
        totalPaidAmount = totalPaidAmount.add(amt);

        if (p.paymentMethod === "CASH") {
          const rec = p.receivedAmount
            ? new Prisma.Decimal(p.receivedAmount)
            : amt;
          if (rec.lt(amt)) {
            throw new BadRequestException(
              `Cash received (${rec}) cannot be less than payment amount (${amt})`,
            );
          }
          totalCashReceived = totalCashReceived.add(rec);
          totalChangeAmount = totalChangeAmount.add(rec.sub(amt));
        }
      }

      if (totalPaidAmount.lt(grandTotalAmount)) {
        throw new BadRequestException(
          `Insufficient payment amount. Required: ₹${grandTotalAmount}, Provided: ₹${totalPaidAmount}`,
        );
      }

      // If customer is not attached, require default retail customer or create walk-in customer
      let finalCustomerId = customerId;
      if (!finalCustomerId) {
        let walkInCustomer = await tx.customer.findFirst({
          where: {
            organizationId,
            customerCode: "CUST-WALKIN",
            deletedAt: null,
          },
        });
        if (!walkInCustomer) {
          walkInCustomer = await tx.customer.create({
            data: {
              organizationId,
              customerCode: "CUST-WALKIN",
              name: "Walk-in Retail Customer",
              currency: "INR",
              status: "ACTIVE",
            },
          });
        }
        finalCustomerId = walkInCustomer.id;
      }

      // 5. Generate Receipt & Document Numbers
      const receiptNumber = await this.generateReceiptNumber(
        organizationId,
        tx,
      );
      const soNumber = await this.generateSONumber(organizationId, tx);
      const invNumber = await this.generateINVNumber(organizationId, tx);
      const dnNumber = await this.generateDNNumber(organizationId, tx);

      // 6. Create Sales Order (DELIVERED)
      const salesOrder = await tx.salesOrder.create({
        data: {
          organizationId,
          orderNumber: soNumber,
          customerId: finalCustomerId,
          branchId: session.branchId,
          warehouseId: session.warehouseId,
          orderDate: new Date(),
          subtotalAmount,
          discountAmount: totalDiscountAmount,
          taxAmount: taxAmountTotal,
          totalAmount: grandTotalAmount,
          notes: dto.notes || `POS Sale: ${receiptNumber}`,
          status: "DELIVERED",
          items: {
            create: cart.items.map((i) => ({
              organizationId,
              productId: i.productId,
              variantId: i.variantId || null,
              orderedQty: i.quantity,
              deliveredQty: i.quantity,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount,
              taxRate: i.taxRate,
              taxAmount: i.taxAmount,
              totalAmount: i.totalAmount,
            })),
          },
        },
        include: { items: true },
      });

      // 7. Create Delivery Note (POSTED)
      const deliveryNote = await tx.deliveryNote.create({
        data: {
          organizationId,
          deliveryNumber: dnNumber,
          salesOrderId: salesOrder.id,
          customerId: finalCustomerId,
          warehouseId: session.warehouseId,
          deliveredById: cashierId,
          deliveryDate: new Date(),
          notes: `POS Direct Dispatch: ${receiptNumber}`,
          status: "POSTED",
          items: {
            create: cart.items.map((i, idx) => ({
              organizationId,
              salesOrderItemId: salesOrder.items[idx].id,
              productId: i.productId,
              variantId: i.variantId || null,
              locationId: defaultLocation.id,
              quantity: i.quantity,
            })),
          },
        },
      });

      // 8. Create Sales Invoice (PAID)
      const salesInvoice = await tx.salesInvoice.create({
        data: {
          organizationId,
          invoiceNumber: invNumber,
          customerId: finalCustomerId,
          salesOrderId: salesOrder.id,
          invoiceDate: new Date(),
          dueDate: new Date(),
          subtotalAmount,
          discountAmount: totalDiscountAmount,
          taxAmount: taxAmountTotal,
          totalAmount: grandTotalAmount,
          paidAmount: grandTotalAmount,
          status: "PAID",
          items: {
            create: cart.items.map((i) => ({
              organizationId,
              productId: i.productId,
              variantId: i.variantId || null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount,
              taxRate: i.taxRate,
              taxAmount: i.taxAmount,
              totalAmount: i.totalAmount,
            })),
          },
        },
      });

      // 9. Record Customer Payments
      for (const p of dto.payments) {
        const payNumber = await this.generatePAYNumber(organizationId, tx);
        await tx.customerPayment.create({
          data: {
            organizationId,
            paymentNumber: payNumber,
            customerId: finalCustomerId,
            salesInvoiceId: salesInvoice.id,
            amount: new Prisma.Decimal(p.amount),
            paymentDate: new Date(),
            paymentMethod: p.paymentMethod,
            referenceNumber: p.referenceNumber || receiptNumber,
            notes: `POS Payment for ${receiptNumber}`,
          },
        });
      }

      // 10. Deduct Physical Stock & FIFO Cost Layers
      for (const item of cart.items) {
        const qty = item.quantity;

        const stockLevel = await tx.stockLevel.findFirst({
          where: {
            organizationId,
            warehouseId: session.warehouseId,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });

        // Active cost layer unit cost or product cost price
        const activeCostLayer = await tx.inventoryCostLayer.findFirst({
          where: {
            organizationId,
            productId: item.productId,
            variantId: item.variantId || null,
            status: "ACTIVE",
          },
          orderBy: { createdAt: "asc" },
        });

        const unitCost = activeCostLayer
          ? activeCostLayer.unitCost
          : item.product.costPrice;

        // StockMovement (SALE_SHIPMENT)
        await tx.stockMovement.create({
          data: {
            organizationId,
            branchId: session.branchId,
            warehouseId: session.warehouseId,
            locationId: defaultLocation.id,
            productId: item.productId,
            variantId: item.variantId || null,
            movementType: "SALE_SHIPMENT",
            quantity: qty.negated(),
            unitCost,
            totalCost: qty.mul(unitCost),
            referenceType: "POS_SALE",
            referenceId: receiptNumber,
            actorId: cashierId,
            notes: `POS Direct Checkout: ${receiptNumber}`,
          },
        });

        // Decrease stockLevel.onHand
        if (stockLevel) {
          await tx.stockLevel.update({
            where: { id: stockLevel.id },
            data: {
              onHand: stockLevel.onHand.sub(qty),
              version: { increment: 1 },
            },
          });
        }

        // FIFO Cost Layer Consumption
        let qtyToDeduct = qty;
        const costLayers = await tx.inventoryCostLayer.findMany({
          where: {
            organizationId,
            productId: item.productId,
            variantId: item.variantId || null,
            status: "ACTIVE",
          },
          orderBy: { createdAt: "asc" },
        });

        for (const layer of costLayers) {
          if (qtyToDeduct.isZero()) break;
          if (layer.remainingQty.lte(qtyToDeduct)) {
            qtyToDeduct = qtyToDeduct.sub(layer.remainingQty);
            await tx.inventoryCostLayer.update({
              where: { id: layer.id },
              data: {
                remainingQty: new Prisma.Decimal(0),
                status: "EXHAUSTED",
              },
            });
          } else {
            await tx.inventoryCostLayer.update({
              where: { id: layer.id },
              data: { remainingQty: layer.remainingQty.sub(qtyToDeduct) },
            });
            qtyToDeduct = new Prisma.Decimal(0);
          }
        }
      }

      // 11. Create POSSale and POSPayment records
      const posSale = await tx.pOSSale.create({
        data: {
          organizationId,
          branchId: session.branchId,
          warehouseId: session.warehouseId,
          sessionId: dto.sessionId,
          cartId: dto.cartId,
          salesOrderId: salesOrder.id,
          salesInvoiceId: salesInvoice.id,
          receiptNumber,
          customerId: finalCustomerId,
          cashierId,
          subtotalAmount,
          discountAmount: totalDiscountAmount,
          taxAmount: taxAmountTotal,
          totalAmount: grandTotalAmount,
          paidAmount: totalPaidAmount,
          changeAmount: totalChangeAmount,
          status: "COMPLETED",
          payments: {
            create: dto.payments.map((p) => ({
              organizationId,
              paymentMethod: p.paymentMethod,
              amount: new Prisma.Decimal(p.amount),
              receivedAmount: p.receivedAmount
                ? new Prisma.Decimal(p.receivedAmount)
                : null,
              changeAmount:
                p.paymentMethod === "CASH" && p.receivedAmount
                  ? new Prisma.Decimal(p.receivedAmount).sub(
                      new Prisma.Decimal(p.amount),
                    )
                  : null,
              referenceNumber: p.referenceNumber || null,
            })),
          },
        },
        include: {
          payments: true,
          customer: true,
          cashier: { select: { id: true, firstName: true, lastName: true } },
          branch: { select: { id: true, name: true, code: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
      });

      // 12. Update POSCart to COMPLETED
      await tx.pOSCart.update({
        where: { id: dto.cartId },
        data: { status: "COMPLETED" },
      });

      // 13. Log Activity
      await tx.activityLog.create({
        data: {
          organizationId,
          actorId: cashierId,
          action: "pos.checkout",
          entityType: "POSSale",
          entityId: posSale.id,
          metadata: {
            receiptNumber,
            totalAmount: Number(grandTotalAmount),
            itemsCount: cart.items.length,
          },
        },
      });

      // 14. Post GL Journal Entry for POS Sale
      const salesRevId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "SALES_REVENUE", "4010");
      const outputTaxId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "OUTPUT_TAX", "2020");
      const cashId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "CASH", "1011");
      const cardClearingId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "CARD_CLEARING", "1051");
      const upiClearingId = await this.journalEntriesService.getMappedAccountId(tx, organizationId, "UPI_CLEARING", "1052");

      const subtotalVal = Number(subtotalAmount);
      const taxVal = Number(taxAmountTotal);

      const glLines: any[] = [];
      for (const p of dto.payments) {
        const amt = Number(p.amount);
        let paymentAccId = cashId;
        if (p.paymentMethod === "CREDIT_CARD") paymentAccId = cardClearingId;
        else if (p.paymentMethod === "UPI") paymentAccId = upiClearingId;

        glLines.push({ accountId: paymentAccId, debit: amt, credit: 0, customerId: finalCustomerId, branchId: session.branchId });
      }

      glLines.push({ accountId: salesRevId, debit: 0, credit: subtotalVal, customerId: finalCustomerId, branchId: session.branchId });
      if (taxVal > 0) {
        glLines.push({ accountId: outputTaxId, debit: 0, credit: taxVal, customerId: finalCustomerId, branchId: session.branchId });
      }

      await this.journalEntriesService.postOperationalJournal(tx, {
        orgId: organizationId,
        userId: cashierId,
        sourceModule: "POS",
        referenceType: "POSSale",
        referenceId: posSale.id,
        description: `POS Sale: ${receiptNumber}`,
        postingDate: new Date(),
        lines: glLines,
      });

      return {
        sale: posSale,
        salesOrder,
        salesInvoice,
        deliveryNote,
        cartItems: cart.items,
      };
    });
  }

  async getSales(organizationId: string, sessionId?: string) {
    const where: Prisma.POSSaleWhereInput = { organizationId };
    if (sessionId) where.sessionId = sessionId;

    return this.prisma.pOSSale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        cashier: { select: { id: true, firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSaleById(organizationId: string, id: string) {
    const sale = await this.prisma.pOSSale.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        cashier: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        branch: true,
        warehouse: true,
        payments: true,
        salesOrder: {
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
        salesInvoice: true,
      },
    });
    if (!sale) throw new NotFoundException("POS Sale not found");
    return sale;
  }
}

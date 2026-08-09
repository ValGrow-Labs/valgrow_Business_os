import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreatePosCartDto,
  AddPosCartItemDto,
  UpdatePosCartItemDto,
} from "../dto/cart.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class PosCartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(organizationId: string, id: string) {
    const cart = await this.prisma.pOSCart.findFirst({
      where: { id, organizationId },
      include: {
        session: true,
        customer: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, images: true },
            },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });
    if (!cart) throw new NotFoundException("POS Cart not found");
    return cart;
  }

  async createCart(organizationId: string, dto: CreatePosCartDto) {
    const session = await this.prisma.pOSSession.findFirst({
      where: { id: dto.sessionId, organizationId, status: "OPEN" },
    });
    if (!session) {
      throw new BadRequestException("Active OPEN POS Session not found");
    }

    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, organizationId, deletedAt: null },
      });
      if (!customer) throw new BadRequestException("Customer not found");
    }

    return this.prisma.pOSCart.create({
      data: {
        organizationId,
        branchId: dto.branchId,
        warehouseId: dto.warehouseId,
        sessionId: dto.sessionId,
        customerId: dto.customerId || null,
        notes: dto.notes,
        status: "ACTIVE",
      },
      include: { items: true, customer: true },
    });
  }

  async addItem(
    organizationId: string,
    cartId: string,
    dto: AddPosCartItemDto,
  ) {
    const cart = await this.getCart(organizationId, cartId);
    if (cart.status !== "ACTIVE" && cart.status !== "HELD") {
      throw new BadRequestException(`Cannot modify a ${cart.status} cart`);
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        organizationId,
        status: "ACTIVE",
        deletedAt: null,
      },
      include: { tax: true },
    });
    if (!product) throw new BadRequestException("Product not found");

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: dto.variantId,
          productId: dto.productId,
          organizationId,
          status: "ACTIVE",
          deletedAt: null,
        },
      });
      if (!variant) throw new BadRequestException("Product Variant not found");
    }

    // Determine unit price from ProductPrice (RETAIL) if not explicitly provided
    let unitPrice = new Prisma.Decimal(dto.unitPrice || 0);
    if (!dto.unitPrice) {
      const priceRecord = await this.prisma.productPrice.findFirst({
        where: {
          organizationId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          tier: "RETAIL",
        },
      });
      unitPrice = priceRecord ? priceRecord.price : product.costPrice;
    }

    // Tax rate from Product Tax master data or DTO
    const taxRate =
      dto.taxRate !== undefined
        ? new Prisma.Decimal(dto.taxRate)
        : product.tax
          ? product.tax.rate
          : new Prisma.Decimal(0);

    const qty = new Prisma.Decimal(dto.quantity);
    const discount = new Prisma.Decimal(dto.discountAmount || 0);

    // Line calculations
    const lineSubtotal = qty.mul(unitPrice).sub(discount);
    if (lineSubtotal.isNegative()) {
      throw new BadRequestException("Discount cannot exceed line subtotal");
    }

    const taxAmount = lineSubtotal.mul(taxRate).div(100);
    const totalAmount = lineSubtotal.add(taxAmount);

    return this.prisma.$transaction(async (tx) => {
      // Check if item already exists in cart -> increment quantity
      const existingItem = cart.items.find(
        (i) =>
          i.productId === dto.productId &&
          i.variantId === (dto.variantId || null),
      );

      if (existingItem) {
        const newQty = existingItem.quantity.add(qty);
        const newSubtotal = newQty.mul(unitPrice).sub(discount);
        const newTaxAmount = newSubtotal.mul(taxRate).div(100);
        const newTotalAmount = newSubtotal.add(newTaxAmount);

        await tx.pOSCartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQty,
            unitPrice,
            discountAmount: discount,
            taxRate,
            taxAmount: newTaxAmount,
            totalAmount: newTotalAmount,
          },
        });
      } else {
        await tx.pOSCartItem.create({
          data: {
            organizationId,
            cartId,
            productId: dto.productId,
            variantId: dto.variantId || null,
            quantity: qty,
            unitPrice,
            discountAmount: discount,
            taxRate,
            taxAmount,
            totalAmount,
          },
        });
      }

      return this.recalculateCartTotals(organizationId, cartId, tx);
    });
  }

  async updateItem(
    organizationId: string,
    cartId: string,
    itemId: string,
    dto: UpdatePosCartItemDto,
  ) {
    const cart = await this.getCart(organizationId, cartId);
    if (cart.status !== "ACTIVE" && cart.status !== "HELD") {
      throw new BadRequestException(`Cannot modify a ${cart.status} cart`);
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException("Item not found in cart");

    const qty = new Prisma.Decimal(dto.quantity);
    const unitPrice =
      dto.unitPrice !== undefined
        ? new Prisma.Decimal(dto.unitPrice)
        : item.unitPrice;
    const discount =
      dto.discountAmount !== undefined
        ? new Prisma.Decimal(dto.discountAmount)
        : item.discountAmount;

    const lineSubtotal = qty.mul(unitPrice).sub(discount);
    if (lineSubtotal.isNegative()) {
      throw new BadRequestException("Discount cannot exceed line subtotal");
    }

    const taxAmount = lineSubtotal.mul(item.taxRate).div(100);
    const totalAmount = lineSubtotal.add(taxAmount);

    return this.prisma.$transaction(async (tx) => {
      await tx.pOSCartItem.update({
        where: { id: itemId },
        data: {
          quantity: qty,
          unitPrice,
          discountAmount: discount,
          taxAmount,
          totalAmount,
        },
      });

      return this.recalculateCartTotals(organizationId, cartId, tx);
    });
  }

  async removeItem(organizationId: string, cartId: string, itemId: string) {
    const cart = await this.getCart(organizationId, cartId);
    if (cart.status !== "ACTIVE" && cart.status !== "HELD") {
      throw new BadRequestException(`Cannot modify a ${cart.status} cart`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.pOSCartItem.delete({
        where: { id: itemId },
      });
      return this.recalculateCartTotals(organizationId, cartId, tx);
    });
  }

  async holdCart(organizationId: string, cartId: string, notes?: string) {
    const cart = await this.getCart(organizationId, cartId);
    if (cart.status !== "ACTIVE") {
      throw new BadRequestException("Only ACTIVE carts can be held");
    }
    return this.prisma.pOSCart.update({
      where: { id: cartId },
      data: {
        status: "HELD",
        notes: notes || cart.notes,
      },
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  async resumeCart(organizationId: string, cartId: string) {
    const cart = await this.getCart(organizationId, cartId);
    if (cart.status !== "HELD") {
      throw new BadRequestException("Only HELD carts can be resumed");
    }
    return this.prisma.pOSCart.update({
      where: { id: cartId },
      data: { status: "ACTIVE" },
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  async clearCart(organizationId: string, cartId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.pOSCartItem.deleteMany({ where: { cartId } });
      return tx.pOSCart.update({
        where: { id: cartId },
        data: {
          subtotalAmount: new Prisma.Decimal(0),
          discountAmount: new Prisma.Decimal(0),
          taxAmount: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(0),
          status: "ABANDONED",
        },
      });
    });
  }

  public async recalculateCartTotals(
    organizationId: string,
    cartId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const db = txClient || this.prisma;
    const items = await db.pOSCartItem.findMany({ where: { cartId } });

    const subtotal = items.reduce(
      (sum, i) => sum.add(i.quantity.mul(i.unitPrice)),
      new Prisma.Decimal(0),
    );
    const lineDiscounts = items.reduce(
      (sum, i) => sum.add(i.discountAmount),
      new Prisma.Decimal(0),
    );
    const taxTotal = items.reduce(
      (sum, i) => sum.add(i.taxAmount),
      new Prisma.Decimal(0),
    );

    const netSubtotal = subtotal.sub(lineDiscounts);
    const totalAmount = netSubtotal.add(taxTotal);

    return db.pOSCart.update({
      where: { id: cartId },
      data: {
        subtotalAmount: subtotal,
        discountAmount: lineDiscounts,
        taxAmount: taxTotal,
        totalAmount,
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
        customer: true,
      },
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  SendToBillingDto,
  SendToPaymentDto,
  CancelPosTransactionDto,
  ReturnToQueueDto,
  PosQueueFilterDto,
} from "../dto/workflow.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class PosWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCartNumber(
    organizationId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "POS_CART",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: {
        organizationId,
        documentType: "POS_CART",
        year,
        lastSequence: 1,
      },
    });
    return `TKT-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  /**
   * Salesperson sends a draft cart to the billing queue
   */
  async sendToBilling(
    organizationId: string,
    actorId: string,
    cartId: string,
    dto?: SendToBillingDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.pOSCart.findFirst({
        where: { id: cartId, organizationId },
        include: { items: true },
      });

      if (!cart) {
        throw new NotFoundException("POS Cart not found");
      }

      if (cart.workflowStatus !== "DRAFT") {
        throw new BadRequestException(
          `Cannot send cart to billing from status '${cart.workflowStatus}'. Must be in 'DRAFT'.`,
        );
      }

      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException(
          "Cannot send an empty cart to billing queue. Add at least one item.",
        );
      }

      // Generate ticket/cart number if not assigned yet
      const cartNumber =
        cart.cartNumber || (await this.generateCartNumber(organizationId, tx));

      // Validate customer if provided in dto
      let finalCustomerId = cart.customerId;
      if (dto?.customerId !== undefined) {
        if (dto.customerId) {
          const customer = await tx.customer.findFirst({
            where: { id: dto.customerId, organizationId, deletedAt: null },
          });
          if (!customer) throw new BadRequestException("Customer not found");
          finalCustomerId = dto.customerId;
        } else {
          finalCustomerId = null;
        }
      }

      const updated = await tx.pOSCart.update({
        where: { id: cartId },
        data: {
          cartNumber,
          workflowStatus: "SENT_TO_BILLING",
          salespersonId: cart.salespersonId || actorId,
          customerId: finalCustomerId,
          notes: dto?.notes || cart.notes,
        },
        include: {
          customer: true,
          salesperson: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
              variant: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
            },
          },
          transitions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      await tx.pOSWorkflowTransition.create({
        data: {
          organizationId,
          cartId,
          fromStatus: "DRAFT",
          toStatus: "SENT_TO_BILLING",
          actorId,
          notes: dto?.notes || "Cart sent to billing counter",
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "pos.workflow.send_to_billing",
          entityType: "POSCart",
          entityId: cartId,
          metadata: {
            cartNumber,
            totalAmount: Number(cart.totalAmount),
            itemsCount: cart.items.length,
          },
        },
      });

      return updated;
    });
  }

  /**
   * List pending billing work for authorized billing staff
   */
  async getBillingQueue(organizationId: string, filter?: PosQueueFilterDto) {
    const where: Prisma.POSCartWhereInput = {
      organizationId,
      workflowStatus: filter?.status
        ? filter.status
        : { in: ["SENT_TO_BILLING", "BILLING_IN_PROGRESS"] },
    };

    if (filter?.branchId) {
      where.branchId = filter.branchId;
    }
    if (filter?.warehouseId) {
      where.warehouseId = filter.warehouseId;
    }

    if (filter?.search) {
      const search = filter.search.trim();
      where.OR = [
        { cartNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.pOSCart.count({ where }),
      this.prisma.pOSCart.findMany({
        where,
        include: {
          customer: true,
          salesperson: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          billingStaff: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          branch: { select: { id: true, name: true, code: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
              variant: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
            },
          },
          transitions: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { createdAt: "asc" }, // FIFO queue
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Claim a cart for billing, preventing concurrent claims by two employees
   */
  async claimBilling(organizationId: string, actorId: string, cartId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Atomic conditional update: only claim if currently in SENT_TO_BILLING
      const updateResult = await tx.pOSCart.updateMany({
        where: {
          id: cartId,
          organizationId,
          workflowStatus: "SENT_TO_BILLING",
        },
        data: {
          workflowStatus: "BILLING_IN_PROGRESS",
          billingStaffId: actorId,
          billingClaimedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        // Find existing record to provide clear exception
        const existing = await tx.pOSCart.findFirst({
          where: { id: cartId, organizationId },
        });

        if (!existing) {
          throw new NotFoundException("POS Cart not found");
        }

        if (existing.workflowStatus === "BILLING_IN_PROGRESS") {
          if (existing.billingStaffId === actorId) {
            return tx.pOSCart.findUniqueOrThrow({
              where: { id: cartId },
              include: {
                customer: true,
                salesperson: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                billingStaff: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                branch: { select: { id: true, name: true, code: true } },
                warehouse: { select: { id: true, name: true, code: true } },
                items: {
                  include: {
                    product: {
                      select: { id: true, name: true, sku: true, barcode: true },
                    },
                    variant: {
                      select: { id: true, name: true, sku: true, barcode: true },
                    },
                  },
                },
                transitions: {
                  orderBy: { createdAt: "desc" },
                },
              },
            });
          }
          throw new ConflictException(
            "Cart is currently being processed by another billing staff member",
          );
        }

        throw new BadRequestException(
          `Cannot claim cart in status '${existing.workflowStatus}'. Expected 'SENT_TO_BILLING'.`,
        );
      }

      await tx.pOSWorkflowTransition.create({
        data: {
          organizationId,
          cartId,
          fromStatus: "SENT_TO_BILLING",
          toStatus: "BILLING_IN_PROGRESS",
          actorId,
          notes: "Claimed for billing verification and review",
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "pos.workflow.claim_billing",
          entityType: "POSCart",
          entityId: cartId,
        },
      });

      return tx.pOSCart.findUniqueOrThrow({
        where: { id: cartId },
        include: {
          customer: true,
          salesperson: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          billingStaff: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          branch: { select: { id: true, name: true, code: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
              variant: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
            },
          },
          transitions: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });
  }

  /**
   * Sending a verified bill to the cashier queue
   */
  async sendToPayment(
    organizationId: string,
    actorId: string,
    cartId: string,
    dto?: SendToPaymentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.pOSCart.findFirst({
        where: { id: cartId, organizationId },
        include: { items: true },
      });

      if (!cart) {
        throw new NotFoundException("POS Cart not found");
      }

      if (cart.workflowStatus !== "BILLING_IN_PROGRESS") {
        throw new BadRequestException(
          `Cannot send bill to payment from status '${cart.workflowStatus}'. Expected 'BILLING_IN_PROGRESS'.`,
        );
      }

      if (cart.billingStaffId && cart.billingStaffId !== actorId) {
        // Enforce that only the claiming billing staff member can verify and forward it
        throw new BadRequestException(
          "Cart was claimed by another billing staff member. Only the assigned billing employee can send it to payment.",
        );
      }

      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException(
          "Cannot send an empty bill to payment queue. Cart must have at least one item.",
        );
      }

      const updateResult = await tx.pOSCart.updateMany({
        where: {
          id: cartId,
          organizationId,
          workflowStatus: "BILLING_IN_PROGRESS",
        },
        data: {
          workflowStatus: "READY_FOR_PAYMENT",
          notes: dto?.notes || cart.notes,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          "Failed to forward bill. Status may have changed concurrently.",
        );
      }

      await tx.pOSWorkflowTransition.create({
        data: {
          organizationId,
          cartId,
          fromStatus: "BILLING_IN_PROGRESS",
          toStatus: "READY_FOR_PAYMENT",
          actorId,
          notes: dto?.notes || "Bill verified and forwarded to payment queue",
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "pos.workflow.send_to_payment",
          entityType: "POSCart",
          entityId: cartId,
          metadata: {
            totalAmount: Number(cart.totalAmount),
            itemsCount: cart.items.length,
          },
        },
      });

      return tx.pOSCart.findUniqueOrThrow({
        where: { id: cartId },
        include: {
          customer: true,
          salesperson: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          billingStaff: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          branch: { select: { id: true, name: true, code: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
              variant: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
            },
          },
          transitions: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });
  }

  /**
   * List pending payment work for authorized cashiers
   */
  async getPaymentQueue(organizationId: string, filter?: PosQueueFilterDto) {
    const where: Prisma.POSCartWhereInput = {
      organizationId,
      workflowStatus: filter?.status
        ? filter.status
        : { in: ["READY_FOR_PAYMENT", "PAYMENT_IN_PROGRESS"] },
    };

    if (filter?.branchId) {
      where.branchId = filter.branchId;
    }
    if (filter?.warehouseId) {
      where.warehouseId = filter.warehouseId;
    }

    if (filter?.search) {
      const search = filter.search.trim();
      where.OR = [
        { cartNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.pOSCart.count({ where }),
      this.prisma.pOSCart.findMany({
        where,
        include: {
          customer: true,
          salesperson: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          billingStaff: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          cashier: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          branch: { select: { id: true, name: true, code: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
              variant: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
            },
          },
          transitions: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { createdAt: "asc" }, // FIFO queue
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Claim a bill for payment safely, preventing two cashiers from claiming simultaneously
   */
  async claimPayment(organizationId: string, actorId: string, cartId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Atomic conditional update
      const updateResult = await tx.pOSCart.updateMany({
        where: {
          id: cartId,
          organizationId,
          workflowStatus: "READY_FOR_PAYMENT",
        },
        data: {
          workflowStatus: "PAYMENT_IN_PROGRESS",
          cashierId: actorId,
          paymentClaimedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        const existing = await tx.pOSCart.findFirst({
          where: { id: cartId, organizationId },
        });

        if (!existing) {
          throw new NotFoundException("POS Cart not found");
        }

        if (existing.workflowStatus === "PAYMENT_IN_PROGRESS") {
          if (existing.cashierId === actorId) {
            return tx.pOSCart.findUniqueOrThrow({
              where: { id: cartId },
              include: {
                customer: true,
                salesperson: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                billingStaff: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                cashier: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
                branch: { select: { id: true, name: true, code: true } },
                warehouse: { select: { id: true, name: true, code: true } },
                items: {
                  include: {
                    product: {
                      select: { id: true, name: true, sku: true, barcode: true },
                    },
                    variant: {
                      select: { id: true, name: true, sku: true, barcode: true },
                    },
                  },
                },
                transitions: {
                  orderBy: { createdAt: "desc" },
                },
              },
            });
          }
          throw new ConflictException(
            "Bill is currently being processed by another cashier",
          );
        }

        throw new BadRequestException(
          `Cannot claim bill in status '${existing.workflowStatus}'. Expected 'READY_FOR_PAYMENT'.`,
        );
      }

      await tx.pOSWorkflowTransition.create({
        data: {
          organizationId,
          cartId,
          fromStatus: "READY_FOR_PAYMENT",
          toStatus: "PAYMENT_IN_PROGRESS",
          actorId,
          notes: "Claimed for checkout and payment processing",
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "pos.workflow.claim_payment",
          entityType: "POSCart",
          entityId: cartId,
        },
      });

      return tx.pOSCart.findUniqueOrThrow({
        where: { id: cartId },
        include: {
          customer: true,
          salesperson: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          billingStaff: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          cashier: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          branch: { select: { id: true, name: true, code: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
              variant: {
                select: { id: true, name: true, sku: true, barcode: true },
              },
            },
          },
          transitions: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });
  }

  /**
   * Return a claimed transaction back to its previous pending queue
   */
  async returnToQueue(
    organizationId: string,
    actorId: string,
    cartId: string,
    dto?: ReturnToQueueDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.pOSCart.findFirst({
        where: { id: cartId, organizationId },
      });

      if (!cart) {
        throw new NotFoundException("POS Cart not found");
      }

      if (cart.workflowStatus === "BILLING_IN_PROGRESS") {
        if (cart.billingStaffId && cart.billingStaffId !== actorId) {
          throw new BadRequestException(
            "Cart was claimed by another employee. Only the assigned staff member or manager can return it.",
          );
        }

        await tx.pOSCart.update({
          where: { id: cartId },
          data: {
            workflowStatus: "SENT_TO_BILLING",
            billingStaffId: null,
            billingClaimedAt: null,
          },
        });

        await tx.pOSWorkflowTransition.create({
          data: {
            organizationId,
            cartId,
            fromStatus: "BILLING_IN_PROGRESS",
            toStatus: "SENT_TO_BILLING",
            actorId,
            notes: dto?.notes || "Released back to billing queue",
          },
        });

        await tx.activityLog.create({
          data: {
            organizationId,
            actorId,
            action: "pos.workflow.return_to_billing_queue",
            entityType: "POSCart",
            entityId: cartId,
          },
        });
      } else if (cart.workflowStatus === "PAYMENT_IN_PROGRESS") {
        if (cart.cashierId && cart.cashierId !== actorId) {
          throw new BadRequestException(
            "Bill was claimed by another cashier. Only the assigned cashier or manager can return it.",
          );
        }

        await tx.pOSCart.update({
          where: { id: cartId },
          data: {
            workflowStatus: "READY_FOR_PAYMENT",
            cashierId: null,
            paymentClaimedAt: null,
          },
        });

        await tx.pOSWorkflowTransition.create({
          data: {
            organizationId,
            cartId,
            fromStatus: "PAYMENT_IN_PROGRESS",
            toStatus: "READY_FOR_PAYMENT",
            actorId,
            notes: dto?.notes || "Released back to cashier payment queue",
          },
        });

        await tx.activityLog.create({
          data: {
            organizationId,
            actorId,
            action: "pos.workflow.return_to_payment_queue",
            entityType: "POSCart",
            entityId: cartId,
          },
        });
      } else {
        throw new BadRequestException(
          `Only claimed transactions in 'BILLING_IN_PROGRESS' or 'PAYMENT_IN_PROGRESS' can be returned to queue. Current status: '${cart.workflowStatus}'.`,
        );
      }

      return tx.pOSCart.findUniqueOrThrow({
        where: { id: cartId },
        include: {
          customer: true,
          salesperson: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          billingStaff: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          cashier: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: {
            include: { product: true, variant: true },
          },
          transitions: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });
  }

  /**
   * Cancelling a transaction only through explicitly authorized actions
   */
  async cancelTransaction(
    organizationId: string,
    actorId: string,
    cartId: string,
    dto: CancelPosTransactionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.pOSCart.findFirst({
        where: { id: cartId, organizationId },
      });

      if (!cart) {
        throw new NotFoundException("POS Cart not found");
      }

      if (cart.workflowStatus === "PAID") {
        throw new BadRequestException(
          "Cannot cancel an already completed and paid transaction. Use refund endpoint instead.",
        );
      }

      if (cart.workflowStatus === "CANCELLED") {
        throw new BadRequestException("Transaction is already cancelled");
      }

      const previousStatus = cart.workflowStatus;

      const updated = await tx.pOSCart.update({
        where: { id: cartId },
        data: {
          workflowStatus: "CANCELLED",
          status: "ABANDONED",
          cancellationReason: dto.reason,
          cancelledById: actorId,
          cancelledAt: new Date(),
        },
        include: {
          customer: true,
          salesperson: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          cancelledBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: {
            include: { product: true, variant: true },
          },
          transitions: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      await tx.pOSWorkflowTransition.create({
        data: {
          organizationId,
          cartId,
          fromStatus: previousStatus,
          toStatus: "CANCELLED",
          actorId,
          notes: dto.reason,
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          actorId,
          action: "pos.workflow.cancel",
          entityType: "POSCart",
          entityId: cartId,
          metadata: {
            previousStatus,
            reason: dto.reason,
          },
        },
      });

      return updated;
    });
  }

  /**
   * Get full audit history and transitions for a cart
   */
  async getWorkflowHistory(organizationId: string, cartId: string) {
    const cart = await this.prisma.pOSCart.findFirst({
      where: { id: cartId, organizationId },
      include: {
        customer: true,
        salesperson: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        billingStaff: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        cashier: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        cancelledBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: { product: true, variant: true },
        },
        transitions: {
          include: {
            actor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException("POS Cart not found");
    }

    return cart;
  }
}

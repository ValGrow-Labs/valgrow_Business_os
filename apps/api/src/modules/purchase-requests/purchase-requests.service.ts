import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import {
  UpdatePurchaseRequestDto,
  PRActionDto,
} from "./dto/update-purchase-request.dto";
import { Prisma, RequestStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};

@Injectable()
export class PurchaseRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generatePRNumber(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx || this.prisma;
    const year = new Date().getFullYear();
    const seq = await db.documentSequence.upsert({
      where: {
        organizationId_documentType_year: {
          organizationId,
          documentType: "PR",
          year,
        },
      },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId, documentType: "PR", year, lastSequence: 1 },
    });
    return `PR-${year}-${String(seq.lastSequence).padStart(5, "0")}`;
  }

  private async validateItems(
    organizationId: string,
    items: CreatePurchaseRequestDto["items"],
  ) {
    for (const item of items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, organizationId, deletedAt: null },
      });
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} not found in this organization`,
        );
      }
      if (item.variantId) {
        const variant = await this.prisma.productVariant.findFirst({
          where: { id: item.variantId, organizationId, deletedAt: null },
        });
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.variantId} not found in this organization`,
          );
        }
        if (variant.productId !== item.productId) {
          throw new BadRequestException(
            `Variant ${item.variantId} does not belong to product ${item.productId}`,
          );
        }
      }
    }
  }

  async getPurchaseRequests(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;
    return this.prisma.purchaseRequest.findMany({
      where,
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPurchaseRequestById(id: string, organizationId: string) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id, organizationId },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });
    if (!pr) throw new NotFoundException("Purchase request not found");
    return pr;
  }

  async createPurchaseRequest(
    organizationId: string,
    requesterId: string,
    dto: CreatePurchaseRequestDto,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        "Purchase request must have at least one item",
      );
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, organizationId, deletedAt: null },
      });
      if (!branch)
        throw new BadRequestException("Branch not found in this organization");
    }

    if (dto.warehouseId) {
      const wh = await this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, organizationId, deletedAt: null },
      });
      if (!wh)
        throw new BadRequestException(
          "Warehouse not found in this organization",
        );
    }

    await this.validateItems(organizationId, dto.items);

    return this.prisma.$transaction(async (tx) => {
      const prNumber = await this.generatePRNumber(organizationId, tx);
      return tx.purchaseRequest.create({
        data: {
          organizationId,
          requesterId,
          requestNumber: prNumber,
          branchId: dto.branchId || null,
          warehouseId: dto.warehouseId || "",
          requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : null,
          reason: dto.reason,
          status: "DRAFT",
          items: {
            create: dto.items.map((i) => ({
              organizationId,
              productId: i.productId,
              variantId: i.variantId || null,
              quantity: new Prisma.Decimal(i.quantity),
              estimatedCost: i.estimatedCost
                ? new Prisma.Decimal(i.estimatedCost)
                : new Prisma.Decimal(0),
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  async updatePurchaseRequest(
    id: string,
    organizationId: string,
    dto: UpdatePurchaseRequestDto,
  ) {
    const pr = await this.getPurchaseRequestById(id, organizationId);
    if (pr.status !== "DRAFT") {
      throw new BadRequestException(
        "Only DRAFT purchase requests can be edited",
      );
    }
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        branchId: dto.branchId,
        warehouseId: dto.warehouseId,
        requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : undefined,
        reason: dto.reason,
      },
      include: { items: true },
    });
  }

  private async transition(
    id: string,
    organizationId: string,
    actorId: string,
    targetStatus: RequestStatus,
    dto?: PRActionDto,
  ) {
    const pr = await this.getPurchaseRequestById(id, organizationId);
    const current = pr.status;
    const allowed = VALID_TRANSITIONS[current] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${targetStatus}`,
      );
    }
    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: targetStatus },
      include: { items: true },
    });
    await this.prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        action: `PR_${targetStatus}`,
        entityType: "PurchaseRequest",
        entityId: id,
        metadata: { from: current, to: targetStatus, notes: dto?.notes },
      },
    });
    return updated;
  }

  submit(
    id: string,
    organizationId: string,
    actorId: string,
    dto?: PRActionDto,
  ) {
    return this.transition(id, organizationId, actorId, "SUBMITTED", dto);
  }

  approve(
    id: string,
    organizationId: string,
    actorId: string,
    dto?: PRActionDto,
  ) {
    return this.transition(id, organizationId, actorId, "APPROVED", dto);
  }

  reject(
    id: string,
    organizationId: string,
    actorId: string,
    dto?: PRActionDto,
  ) {
    return this.transition(id, organizationId, actorId, "REJECTED", dto);
  }

  cancel(
    id: string,
    organizationId: string,
    actorId: string,
    dto?: PRActionDto,
  ) {
    return this.transition(id, organizationId, actorId, "CANCELLED", dto);
  }
}

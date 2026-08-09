import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { OpenPosSessionDto, ClosePosSessionDto } from "../dto/session.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class PosSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async getSessions(
    organizationId: string,
    status?: string,
    terminalId?: string,
  ) {
    const where: Prisma.POSSessionWhereInput = { organizationId };
    if (status) where.status = status as any;
    if (terminalId) where.terminalId = terminalId;

    return this.prisma.pOSSession.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        openedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        closedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        sales: {
          select: {
            id: true,
            receiptNumber: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { openedAt: "desc" },
    });
  }

  async getSessionById(organizationId: string, id: string) {
    const session = await this.prisma.pOSSession.findFirst({
      where: { id, organizationId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        openedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        closedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        carts: { include: { items: true, customer: true } },
        sales: { include: { payments: true, customer: true, cashier: true } },
      },
    });
    if (!session) throw new NotFoundException("POS Session not found");
    return session;
  }

  async openSession(
    organizationId: string,
    userId: string,
    dto: OpenPosSessionDto,
  ) {
    // Check if register/terminal already has an OPEN session in organization
    const existing = await this.prisma.pOSSession.findFirst({
      where: {
        organizationId,
        terminalId: dto.terminalId,
        status: "OPEN",
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Terminal ${dto.terminalId} already has an active OPEN session (${existing.id})`,
      );
    }

    // Verify Branch & Warehouse belong to organization
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, organizationId, deletedAt: null },
    });
    if (!branch) throw new BadRequestException("Branch not found");

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, deletedAt: null },
    });
    if (!warehouse) throw new BadRequestException("Warehouse not found");

    return this.prisma.pOSSession.create({
      data: {
        organizationId,
        branchId: dto.branchId,
        warehouseId: dto.warehouseId,
        terminalId: dto.terminalId,
        openedById: userId,
        openingCash: new Prisma.Decimal(dto.openingCash),
        notes: dto.notes,
        status: "OPEN",
      },
      include: {
        branch: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        openedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async closeSession(
    organizationId: string,
    userId: string,
    id: string,
    dto: ClosePosSessionDto,
  ) {
    const session = await this.getSessionById(organizationId, id);
    if (session.status !== "OPEN" && session.status !== "SUSPENDED") {
      throw new BadRequestException(
        `Session is ${session.status} and cannot be closed`,
      );
    }

    // Calculate total cash collected in this session
    const cashPayments = await this.prisma.pOSPayment.findMany({
      where: {
        organizationId,
        paymentMethod: "CASH",
        posSale: { sessionId: id, status: "COMPLETED" },
      },
    });

    const totalCashCollected = cashPayments.reduce(
      (sum: Prisma.Decimal, p) => sum.add(p.amount),
      new Prisma.Decimal(0),
    );

    const expectedCash = session.openingCash.add(totalCashCollected);
    const closingCash = new Prisma.Decimal(dto.closingCash);
    const cashDifference = closingCash.sub(expectedCash);

    return this.prisma.pOSSession.update({
      where: { id },
      data: {
        closedById: userId,
        closedAt: new Date(),
        closingCash,
        expectedCash,
        cashDifference,
        notes: dto.notes
          ? `${session.notes || ""}\n${dto.notes}`
          : session.notes,
        status: "CLOSED",
      },
    });
  }

  async suspendSession(organizationId: string, id: string) {
    const session = await this.getSessionById(organizationId, id);
    if (session.status !== "OPEN") {
      throw new BadRequestException("Only OPEN sessions can be suspended");
    }
    return this.prisma.pOSSession.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });
  }

  async resumeSession(organizationId: string, id: string) {
    const session = await this.getSessionById(organizationId, id);
    if (session.status !== "SUSPENDED") {
      throw new BadRequestException("Only SUSPENDED sessions can be resumed");
    }
    return this.prisma.pOSSession.update({
      where: { id },
      data: { status: "OPEN" },
    });
  }
}

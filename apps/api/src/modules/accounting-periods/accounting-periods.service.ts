import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PeriodStatus } from "@prisma/client";

@Injectable()
export class AccountingPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPeriods(orgId: string, fiscalYearId?: string) {
    return this.prisma.accountingPeriod.findMany({
      where: {
        organizationId: orgId,
        ...(fiscalYearId ? { fiscalYearId } : {}),
      },
      include: { fiscalYear: true },
      orderBy: [{ startDate: "desc" }, { periodNumber: "asc" }],
    });
  }

  async getPeriod(id: string, orgId: string) {
    const period = await this.prisma.accountingPeriod.findFirst({
      where: { id, organizationId: orgId },
      include: { fiscalYear: true },
    });
    if (!period) throw new NotFoundException("Accounting period not found");
    return period;
  }

  async findPeriodForDate(orgId: string, postingDate: Date) {
    const period = await this.prisma.accountingPeriod.findFirst({
      where: {
        organizationId: orgId,
        startDate: { lte: postingDate },
        endDate: { gte: postingDate },
      },
    });

    if (!period) {
      // Auto-create or fetch active open period if within broad range
      const defaultPeriod = await this.prisma.accountingPeriod.findFirst({
        where: { organizationId: orgId, status: "OPEN" },
        orderBy: { startDate: "desc" },
      });
      if (!defaultPeriod) {
        throw new BadRequestException(`No active accounting period found for date ${postingDate.toISOString().split("T")[0]}`);
      }
      return defaultPeriod;
    }

    if (period.status !== "OPEN") {
      throw new BadRequestException(
        `Cannot post accounting entries: Accounting Period ${period.periodName} is ${period.status}`,
      );
    }

    return period;
  }

  async updateStatus(id: string, orgId: string, status: PeriodStatus) {
    const period = await this.getPeriod(id, orgId);

    if (period.status === "LOCKED") {
      throw new BadRequestException("Period is LOCKED. Cannot modify locked accounting periods.");
    }

    if (status === "CLOSED" || status === "LOCKED") {
      // Check for unposted draft entries in this period
      const draftEntriesCount = await this.prisma.journalEntry.count({
        where: { periodId: id, status: "DRAFT" },
      });
      if (draftEntriesCount > 0) {
        throw new BadRequestException(`Cannot close period: ${draftEntriesCount} DRAFT journal entries exist.`);
      }
    }

    return this.prisma.accountingPeriod.update({
      where: { id },
      data: { status },
      include: { fiscalYear: true },
    });
  }
}

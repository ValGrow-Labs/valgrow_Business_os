import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TaxAccountingService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaxSummary(orgId: string, startDate?: string, endDate?: string) {
    const outputTaxAcc = await this.prisma.account.findFirst({
      where: { organizationId: orgId, accountCode: "2020" },
    });
    const inputTaxAcc = await this.prisma.account.findFirst({
      where: { organizationId: orgId, accountCode: "1040" },
    });

    const dateFilter = startDate || endDate
      ? {
          postingDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        }
      : {};

    // Output Tax lines (Liability)
    let totalOutputTax = 0;
    if (outputTaxAcc) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          organizationId: orgId,
          accountId: outputTaxAcc.id,
          journalEntry: { status: "POSTED", ...dateFilter },
        },
      });
      for (const l of lines) {
        totalOutputTax += Number(l.credit) - Number(l.debit);
      }
    }

    // Input Tax lines (Asset / ITC)
    let totalInputTax = 0;
    if (inputTaxAcc) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          organizationId: orgId,
          accountId: inputTaxAcc.id,
          journalEntry: { status: "POSTED", ...dateFilter },
        },
      });
      for (const l of lines) {
        totalInputTax += Number(l.debit) - Number(l.credit);
      }
    }

    const netTaxPayable = totalOutputTax - totalInputTax;

    return {
      period: { startDate, endDate },
      totalOutputTaxCollected: totalOutputTax,
      totalInputTaxClaimed: totalInputTax,
      netTaxPayable: netTaxPayable > 0 ? netTaxPayable : 0,
      netTaxRefundable: netTaxPayable < 0 ? Math.abs(netTaxPayable) : 0,
    };
  }
}

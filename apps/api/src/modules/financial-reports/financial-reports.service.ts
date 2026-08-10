import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AccountType, NormalBalance } from "@prisma/client";

@Injectable()
export class FinancialReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrialBalance(orgId: string, asOfDate?: string) {
    const accounts = await this.prisma.account.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { accountCode: "asc" },
    });

    const dateFilter = asOfDate
      ? { postingDate: { lte: new Date(asOfDate) } }
      : {};

    const trialBalanceRows = [];
    let totalDebitSum = 0;
    let totalCreditSum = 0;

    for (const acc of accounts) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          organizationId: orgId,
          accountId: acc.id,
          journalEntry: { status: "POSTED", ...dateFilter },
        },
      });

      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of lines) {
        totalDebit += Number(line.debit);
        totalCredit += Number(line.credit);
      }

      if (totalDebit === 0 && totalCredit === 0) continue;

      let netDebit = 0;
      let netCredit = 0;

      if (totalDebit >= totalCredit) {
        netDebit = totalDebit - totalCredit;
      } else {
        netCredit = totalCredit - totalDebit;
      }

      totalDebitSum += netDebit;
      totalCreditSum += netCredit;

      trialBalanceRows.push({
        account: {
          id: acc.id,
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          accountType: acc.accountType,
          accountCategory: acc.accountCategory,
          normalBalance: acc.normalBalance,
        },
        debit: netDebit,
        credit: netCredit,
      });
    }

    return {
      asOfDate: asOfDate || new Date().toISOString(),
      rows: trialBalanceRows,
      totals: {
        totalDebit: totalDebitSum,
        totalCredit: totalCreditSum,
        balanced: Math.abs(totalDebitSum - totalCreditSum) < 0.01,
      },
    };
  }

  async getProfitAndLoss(orgId: string, startDate?: string, endDate?: string) {
    const revenueAccounts = await this.prisma.account.findMany({
      where: { organizationId: orgId, accountType: AccountType.REVENUE, deletedAt: null },
    });

    const expenseAccounts = await this.prisma.account.findMany({
      where: { organizationId: orgId, accountType: AccountType.EXPENSE, deletedAt: null },
    });

    const dateFilter = startDate || endDate
      ? {
          postingDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        }
      : {};

    // Revenue calculation
    let totalRevenue = 0;
    const revenueRows = [];
    for (const acc of revenueAccounts) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          organizationId: orgId,
          accountId: acc.id,
          journalEntry: { status: "POSTED", ...dateFilter },
        },
      });

      let netAmount = 0;
      for (const l of lines) {
        // Revenue normal balance is CREDIT
        netAmount += Number(l.credit) - Number(l.debit);
      }

      if (netAmount !== 0) {
        totalRevenue += netAmount;
        revenueRows.push({ accountCode: acc.accountCode, accountName: acc.accountName, amount: netAmount });
      }
    }

    // Expense & COGS calculation
    let totalCOGS = 0;
    let totalOperatingExpense = 0;
    const cogsRows = [];
    const operatingExpenseRows = [];

    for (const acc of expenseAccounts) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          organizationId: orgId,
          accountId: acc.id,
          journalEntry: { status: "POSTED", ...dateFilter },
        },
      });

      let netAmount = 0;
      for (const l of lines) {
        // Expense normal balance is DEBIT
        netAmount += Number(l.debit) - Number(l.credit);
      }

      if (netAmount !== 0) {
        if (acc.accountCode.startsWith("50")) {
          totalCOGS += netAmount;
          cogsRows.push({ accountCode: acc.accountCode, accountName: acc.accountName, amount: netAmount });
        } else {
          totalOperatingExpense += netAmount;
          operatingExpenseRows.push({ accountCode: acc.accountCode, accountName: acc.accountName, amount: netAmount });
        }
      }
    }

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalOperatingExpense;

    return {
      period: { startDate, endDate },
      revenue: { items: revenueRows, total: totalRevenue },
      cogs: { items: cogsRows, total: totalCOGS },
      grossProfit,
      operatingExpenses: { items: operatingExpenseRows, total: totalOperatingExpense },
      netProfit,
    };
  }

  async getBalanceSheet(orgId: string, asOfDate?: string) {
    const assets = await this.prisma.account.findMany({
      where: { organizationId: orgId, accountType: AccountType.ASSET, deletedAt: null },
    });

    const liabilities = await this.prisma.account.findMany({
      where: { organizationId: orgId, accountType: AccountType.LIABILITY, deletedAt: null },
    });

    const equityAccounts = await this.prisma.account.findMany({
      where: { organizationId: orgId, accountType: AccountType.EQUITY, deletedAt: null },
    });

    const dateFilter = asOfDate
      ? { postingDate: { lte: new Date(asOfDate) } }
      : {};

    // Assets (Normal DEBIT)
    let totalAssets = 0;
    const assetRows = [];
    for (const acc of assets) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: { organizationId: orgId, accountId: acc.id, journalEntry: { status: "POSTED", ...dateFilter } },
      });
      let balance = 0;
      for (const l of lines) balance += Number(l.debit) - Number(l.credit);
      if (balance !== 0) {
        totalAssets += balance;
        assetRows.push({ accountCode: acc.accountCode, accountName: acc.accountName, balance });
      }
    }

    // Liabilities (Normal CREDIT)
    let totalLiabilities = 0;
    const liabilityRows = [];
    for (const acc of liabilities) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: { organizationId: orgId, accountId: acc.id, journalEntry: { status: "POSTED", ...dateFilter } },
      });
      let balance = 0;
      for (const l of lines) balance += Number(l.credit) - Number(l.debit);
      if (balance !== 0) {
        totalLiabilities += balance;
        liabilityRows.push({ accountCode: acc.accountCode, accountName: acc.accountName, balance });
      }
    }

    // Equity (Normal CREDIT)
    let totalEquity = 0;
    const equityRows = [];
    for (const acc of equityAccounts) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: { organizationId: orgId, accountId: acc.id, journalEntry: { status: "POSTED", ...dateFilter } },
      });
      let balance = 0;
      for (const l of lines) balance += Number(l.credit) - Number(l.debit);
      if (balance !== 0) {
        totalEquity += balance;
        equityRows.push({ accountCode: acc.accountCode, accountName: acc.accountName, balance });
      }
    }

    // Include Net Profit up to asOfDate into Retained Earnings
    const pnl = await this.getProfitAndLoss(orgId, undefined, asOfDate);
    const retainedEarnings = pnl.netProfit;
    totalEquity += retainedEarnings;
    equityRows.push({ accountCode: "3020", accountName: "Retained Earnings (Current Period Net Profit)", balance: retainedEarnings });

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      asOfDate: asOfDate || new Date().toISOString(),
      assets: { items: assetRows, total: totalAssets },
      liabilities: { items: liabilityRows, total: totalLiabilities },
      equity: { items: equityRows, total: totalEquity },
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    };
  }

  async getGeneralLedgerDetail(orgId: string, accountId: string, startDate?: string, endDate?: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, organizationId: orgId },
    });
    if (!account) throw new NotFoundException("Account not found");

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        organizationId: orgId,
        accountId,
        journalEntry: {
          status: "POSTED",
          ...(startDate || endDate
            ? {
                postingDate: {
                  ...(startDate ? { gte: new Date(startDate) } : {}),
                  ...(endDate ? { lte: new Date(endDate) } : {}),
                },
              }
            : {}),
        },
      },
      include: {
        journalEntry: {
          select: {
            id: true,
            journalNumber: true,
            postingDate: true,
            entryType: true,
            sourceModule: true,
            referenceType: true,
            referenceId: true,
            description: true,
          },
        },
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { journalEntry: { postingDate: "asc" } },
    });

    let runningBalance = 0;
    const isDebitNormal = account.normalBalance === NormalBalance.DEBIT;

    const formattedLines = lines.map((l) => {
      const debit = Number(l.debit);
      const credit = Number(l.credit);

      if (isDebitNormal) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        lineId: l.id,
        postingDate: l.journalEntry.postingDate,
        journalNumber: l.journalEntry.journalNumber,
        sourceModule: l.journalEntry.sourceModule,
        referenceType: l.journalEntry.referenceType,
        referenceId: l.journalEntry.referenceId,
        description: l.description || l.journalEntry.description,
        debit,
        credit,
        runningBalance,
        customer: l.customer,
        supplier: l.supplier,
      };
    });

    return {
      account,
      period: { startDate, endDate },
      totalLines: formattedLines.length,
      endingBalance: runningBalance,
      lines: formattedLines,
    };
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ApSubLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getSupplierBalances(orgId: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { organizationId: orgId, deletedAt: null },
      select: { id: true, name: true, code: true, email: true, phone: true },
    });

    const results = [];
    for (const supp of suppliers) {
      const invoices = await this.prisma.supplierInvoice.findMany({
        where: { organizationId: orgId, supplierId: supp.id, status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
        select: { totalAmount: true, paidAmount: true },
      });

      let totalOutstanding = 0;
      for (const inv of invoices) {
        totalOutstanding += Number(inv.totalAmount) - Number(inv.paidAmount);
      }

      results.push({
        supplier: supp,
        totalOutstanding,
      });
    }

    return results;
  }

  async getSupplierAging(orgId: string, supplierId?: string) {
    const whereInvoice: any = {
      organizationId: orgId,
      status: { in: ["UNPAID", "PARTIALLY_PAID"] },
    };
    if (supplierId) whereInvoice.supplierId = supplierId;

    const invoices = await this.prisma.supplierInvoice.findMany({
      where: whereInvoice,
      include: { supplier: { select: { id: true, name: true, code: true } } },
    });

    const now = new Date();
    const aging = {
      current: 0,
      days1To30: 0,
      days31To60: 0,
      days61To90: 0,
      daysOver90: 0,
      total: 0,
    };

    const supplierMap = new Map<string, any>();

    for (const inv of invoices) {
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (outstanding <= 0) continue;

      const dueDate = inv.dueDate || inv.invoiceDate;
      const diffDays = Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 3600 * 24));

      let category = "current";
      if (diffDays <= 0) category = "current";
      else if (diffDays <= 30) category = "days1To30";
      else if (diffDays <= 60) category = "days31To60";
      else if (diffDays <= 90) category = "days61To90";
      else category = "daysOver90";

      aging[category as keyof typeof aging] += outstanding;
      aging.total += outstanding;

      const sId = inv.supplierId;
      if (!supplierMap.has(sId)) {
        supplierMap.set(sId, {
          supplier: inv.supplier,
          current: 0,
          days1To30: 0,
          days31To60: 0,
          days61To90: 0,
          daysOver90: 0,
          total: 0,
        });
      }

      const sData = supplierMap.get(sId);
      sData[category] += outstanding;
      sData.total += outstanding;
    }

    return {
      summary: aging,
      suppliers: Array.from(supplierMap.values()),
    };
  }

  async getSupplierStatement(orgId: string, supplierId: string, startDate?: string, endDate?: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: orgId },
    });
    if (!supplier) throw new NotFoundException("Supplier not found");

    const invoices = await this.prisma.supplierInvoice.findMany({
      where: {
        organizationId: orgId,
        supplierId,
        ...(startDate || endDate
          ? {
              invoiceDate: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
      },
    });

    const payments = await this.prisma.supplierPayment.findMany({
      where: {
        organizationId: orgId,
        supplierId,
        ...(startDate || endDate
          ? {
              paymentDate: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        paymentNumber: true,
        paymentDate: true,
        amount: true,
        paymentMethod: true,
      },
    });

    const entries: any[] = [];
    for (const inv of invoices) {
      entries.push({
        date: inv.invoiceDate,
        type: "INVOICE",
        reference: inv.invoiceNumber,
        debit: 0,
        credit: Number(inv.totalAmount),
      });
    }

    for (const pay of payments) {
      entries.push({
        date: pay.paymentDate,
        type: "PAYMENT",
        reference: pay.paymentNumber,
        debit: Number(pay.amount),
        credit: 0,
      });
    }

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const ledger = entries.map((e) => {
      runningBalance += e.credit - e.debit;
      return { ...e, runningBalance };
    });

    return {
      supplier,
      statementPeriod: { startDate, endDate },
      closingBalance: runningBalance,
      transactions: ledger,
    };
  }
}

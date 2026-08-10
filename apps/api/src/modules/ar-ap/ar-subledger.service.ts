import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ArSubLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerBalances(orgId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { organizationId: orgId, deletedAt: null },
      select: { id: true, name: true, customerCode: true, email: true, phone: true },
    });

    const results = [];
    for (const cust of customers) {
      const invoices = await this.prisma.salesInvoice.findMany({
        where: { organizationId: orgId, customerId: cust.id, status: { in: ["POSTED", "PARTIALLY_PAID"] } },
        select: { totalAmount: true, paidAmount: true },
      });

      let totalOutstanding = 0;
      for (const inv of invoices) {
        totalOutstanding += Number(inv.totalAmount) - Number(inv.paidAmount);
      }

      results.push({
        customer: cust,
        totalOutstanding,
      });
    }

    return results;
  }

  async getCustomerAging(orgId: string, customerId?: string) {
    const whereInvoice: any = {
      organizationId: orgId,
      status: { in: ["POSTED", "PARTIALLY_PAID"] },
    };
    if (customerId) whereInvoice.customerId = customerId;

    const invoices = await this.prisma.salesInvoice.findMany({
      where: whereInvoice,
      include: { customer: { select: { id: true, name: true, customerCode: true } } },
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

    const customerMap = new Map<string, any>();

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

      const cId = inv.customerId;
      if (!customerMap.has(cId)) {
        customerMap.set(cId, {
          customer: inv.customer,
          current: 0,
          days1To30: 0,
          days31To60: 0,
          days61To90: 0,
          daysOver90: 0,
          total: 0,
        });
      }

      const cData = customerMap.get(cId);
      cData[category] += outstanding;
      cData.total += outstanding;
    }

    return {
      summary: aging,
      customers: Array.from(customerMap.values()),
    };
  }

  async getCustomerStatement(orgId: string, customerId: string, startDate?: string, endDate?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId: orgId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        organizationId: orgId,
        customerId,
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

    const payments = await this.prisma.customerPayment.findMany({
      where: {
        organizationId: orgId,
        customerId,
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
        debit: Number(inv.totalAmount),
        credit: 0,
      });
    }

    for (const pay of payments) {
      entries.push({
        date: pay.paymentDate,
        type: "PAYMENT",
        reference: pay.paymentNumber,
        debit: 0,
        credit: Number(pay.amount),
      });
    }

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const ledger = entries.map((e) => {
      runningBalance += e.debit - e.credit;
      return { ...e, runningBalance };
    });

    return {
      customer,
      statementPeriod: { startDate, endDate },
      closingBalance: runningBalance,
      transactions: ledger,
    };
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class Customer360Service {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomer360(customerId: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const [
      contacts,
      activities,
      tasks,
      crmNotes,
      tags,
      opportunities,
      quotations,
      salesOrders,
      salesInvoices,
      customerPayments,
      salesReturns,
      posSales,
    ] = await Promise.all([
      this.prisma.customerContact.findMany({
        where: { customerId, organizationId, deletedAt: null },
        orderBy: { isPrimary: "desc" },
      }),
      this.prisma.crmActivity.findMany({
        where: { customerId, organizationId },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { activityDate: "desc" },
      }),
      this.prisma.crmTask.findMany({
        where: { customerId, organizationId },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.crmNote.findMany({
        where: { customerId, organizationId, deletedAt: null },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.customerTag.findMany({
        where: { customerId, organizationId },
        include: { tag: true },
      }),
      this.prisma.opportunity.findMany({
        where: { customerId, organizationId, deletedAt: null },
        include: { stage: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.quotation.findMany({
        where: { customerId, organizationId },
        orderBy: { quotationDate: "desc" },
      }),
      this.prisma.salesOrder.findMany({
        where: { customerId, organizationId },
        orderBy: { orderDate: "desc" },
      }),
      this.prisma.salesInvoice.findMany({
        where: { customerId, organizationId },
        orderBy: { invoiceDate: "desc" },
      }),
      this.prisma.customerPayment.findMany({
        where: { customerId, organizationId },
        orderBy: { paymentDate: "desc" },
      }),
      this.prisma.salesReturn.findMany({
        where: { customerId, organizationId },
        orderBy: { returnDate: "desc" },
      }),
      this.prisma.pOSSale.findMany({
        where: { customerId, organizationId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Financial & Sales Aggregations
    const invoiceTotal = salesInvoices.reduce(
      (acc, inv) => acc + Number(inv.totalAmount),
      0,
    );
    const invoicePaid = salesInvoices.reduce(
      (acc, inv) => acc + Number(inv.paidAmount),
      0,
    );
    const posTotal = posSales.reduce(
      (acc, sale) => acc + Number(sale.totalAmount),
      0,
    );
    const paymentTotal = customerPayments.reduce(
      (acc, p) => acc + Number(p.amount),
      0,
    );

    const totalPurchases = invoiceTotal + posTotal;
    const totalPaid = invoicePaid + posTotal;
    const outstandingBalance = Math.max(0, invoiceTotal - invoicePaid);

    const wonOpps = opportunities.filter((o) => o.status === "WON");
    const wonOpportunitiesValue = wonOpps.reduce(
      (acc, o) => acc + Number(o.estimatedValue),
      0,
    );

    // Build Unified Chronological Interaction Timeline
    const timeline: Array<{
      id: string;
      kind: string;
      title: string;
      description?: string;
      timestamp: Date;
      metadata?: any;
    }> = [];

    activities.forEach((act) => {
      timeline.push({
        id: act.id,
        kind: `ACTIVITY_${act.type}`,
        title: act.subject,
        description: act.description || undefined,
        timestamp: act.activityDate,
        metadata: {
          priority: act.priority,
          status: act.status,
          assignedTo: act.assignedTo
            ? `${act.assignedTo.firstName} ${act.assignedTo.lastName}`
            : null,
        },
      });
    });

    tasks.forEach((tsk) => {
      timeline.push({
        id: tsk.id,
        kind: "TASK",
        title: tsk.title,
        description: tsk.description || undefined,
        timestamp: tsk.dueDate,
        metadata: {
          priority: tsk.priority,
          status: tsk.status,
          completedAt: tsk.completedAt,
        },
      });
    });

    crmNotes.forEach((note) => {
      timeline.push({
        id: note.id,
        kind: "NOTE",
        title: "Internal Note",
        description: note.content,
        timestamp: note.createdAt,
        metadata: {
          author: note.author
            ? `${note.author.firstName} ${note.author.lastName}`
            : null,
        },
      });
    });

    quotations.forEach((quo) => {
      timeline.push({
        id: quo.id,
        kind: "QUOTATION",
        title: `Quotation ${quo.quotationNumber}`,
        description: `Total: ₹${Number(quo.totalAmount).toFixed(2)} - Status: ${quo.status}`,
        timestamp: quo.quotationDate,
        metadata: { status: quo.status, amount: Number(quo.totalAmount) },
      });
    });

    salesOrders.forEach((so) => {
      timeline.push({
        id: so.id,
        kind: "SALES_ORDER",
        title: `Sales Order ${so.orderNumber}`,
        description: `Total: ₹${Number(so.totalAmount).toFixed(2)} - Status: ${so.status}`,
        timestamp: so.orderDate,
        metadata: { status: so.status, amount: Number(so.totalAmount) },
      });
    });

    salesInvoices.forEach((inv) => {
      timeline.push({
        id: inv.id,
        kind: "SALES_INVOICE",
        title: `Invoice ${inv.invoiceNumber}`,
        description: `Total: ₹${Number(inv.totalAmount).toFixed(2)} - Status: ${inv.status}`,
        timestamp: inv.invoiceDate,
        metadata: { status: inv.status, amount: Number(inv.totalAmount) },
      });
    });

    posSales.forEach((pos) => {
      timeline.push({
        id: pos.id,
        kind: "POS_SALE",
        title: `POS Receipt ${pos.receiptNumber}`,
        description: `Total: ₹${Number(pos.totalAmount).toFixed(2)}`,
        timestamp: pos.createdAt,
        metadata: { amount: Number(pos.totalAmount) },
      });
    });

    timeline.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return {
      customer,
      contacts,
      tags: tags.map((t) => t.tag),
      metrics: {
        totalPurchases,
        totalPaid,
        outstandingBalance,
        totalOrders: salesOrders.length + posSales.length,
        totalInvoices: salesInvoices.length,
        totalOpportunities: opportunities.length,
        wonOpportunitiesCount: wonOpps.length,
        wonOpportunitiesValue,
      },
      salesHistory: {
        quotations,
        salesOrders,
        salesInvoices,
        customerPayments,
        salesReturns,
      },
      posHistory: posSales,
      opportunities,
      activities,
      tasks,
      notes: crmNotes,
      timeline,
    };
  }
}

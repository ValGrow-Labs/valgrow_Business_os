import { Injectable, NotFoundException } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require("pdfkit");
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PdfGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  private formatCurrency(
    amount: number | string | null | undefined,
    currencyCode?: string | null | undefined,
  ): string {
    const num = Number(amount || 0);
    const code = (currencyCode || "INR").trim().toUpperCase();

    const localeMap: Record<string, string> = {
      INR: "en-IN",
      USD: "en-US",
      EUR: "de-DE",
      GBP: "en-GB",
      AED: "en-AE",
      JPY: "ja-JP",
      CAD: "en-CA",
      AUD: "en-AU",
      SGD: "en-SG",
    };

    const locale = localeMap[code] || "en-US";
    const formatted = num.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${code} ${formatted}`;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  private formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ============================================================================
  // 1. SALES INVOICE PDF
  // ============================================================================
  async generateSalesInvoicePdf(invoiceId: string, organizationId: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        organization: true,
        customer: true,
        salesOrder: {
          include: { branch: true, warehouse: true },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        customerPayments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException("Sales Invoice not found");
    }

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk: any) => chunks.push(chunk));
      doc.on("end", () =>
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `${invoice.invoiceNumber}.pdf`,
        }),
      );
      doc.on("error", (err: any) => reject(err));

      // Header Banner
      doc.rect(40, 40, 515, 60).fill("#1e293b");
      doc.fillColor("#ffffff").fontSize(20).text("TAX INVOICE", 55, 55);
      doc.fontSize(10).text(invoice.organization.name, 350, 55, { align: "right", width: 190 });
      doc.fontSize(8).text(invoice.organization.legalName || "", 350, 70, { align: "right", width: 190 });

      // Invoice Meta Details
      doc.fillColor("#0f172a").fontSize(10).text(`Invoice Number:`, 40, 115).font("Helvetica-Bold").text(invoice.invoiceNumber, 130, 115);
      doc.font("Helvetica").text(`Invoice Date:`, 40, 130).text(this.formatDate(invoice.invoiceDate), 130, 130);
      doc.text(`Due Date:`, 40, 145).text(this.formatDate(invoice.dueDate), 130, 145);
      doc.text(`Status:`, 40, 160).font("Helvetica-Bold").text(invoice.status, 130, 160);

      // Billed To Box
      doc.rect(310, 110, 245, 70).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fillColor("#475569").fontSize(9).font("Helvetica-Bold").text("BILLED TO:", 320, 118);
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text(invoice.customer.name, 320, 130);
      doc.font("Helvetica").fontSize(8).fillColor("#334155");
      if (invoice.customer.customerCode) doc.text(`Code: ${invoice.customer.customerCode}`, 320, 143);
      if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`, 320, 153);
      if (invoice.customer.address) doc.text(`Address: ${invoice.customer.address}, ${invoice.customer.city || ""}`, 320, 163);

      // Items Table Header
      let y = 200;
      doc.rect(40, y, 515, 20).fill("#e2e8f0");
      doc.fillColor("#1e293b").fontSize(9).font("Helvetica-Bold");
      doc.text("#", 45, y + 5, { width: 20 });
      doc.text("Item / SKU", 70, y + 5, { width: 190 });
      doc.text("Qty", 265, y + 5, { width: 40, align: "right" });
      doc.text("Price", 310, y + 5, { width: 70, align: "right" });
      doc.text("Tax", 385, y + 5, { width: 50, align: "right" });
      doc.text("Total", 440, y + 5, { width: 105, align: "right" });

      // Items Rows
      y += 25;
      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      invoice.items.forEach((item, idx) => {
        const itemTotal = Number(item.totalAmount);
        const itemPrice = Number(item.unitPrice);
        const itemQty = Number(item.quantity);
        const itemTax = Number(item.taxAmount);

        doc.text(String(idx + 1), 45, y, { width: 20 });
        doc.font("Helvetica-Bold").text(item.product.name, 70, y, { width: 190 });
        if (item.product.sku) {
          doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`SKU: ${item.product.sku}`, 70, y + 10);
        }
        doc.font("Helvetica").fontSize(9).fillColor("#334155");
        doc.text(String(itemQty), 265, y, { width: 40, align: "right" });
        doc.text(this.formatCurrency(itemPrice), 310, y, { width: 70, align: "right" });
        doc.text(this.formatCurrency(itemTax), 385, y, { width: 50, align: "right" });
        doc.font("Helvetica-Bold").text(this.formatCurrency(itemTotal), 440, y, { width: 105, align: "right" });

        y += item.product.sku ? 24 : 18;
        doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor("#f1f5f9").stroke();
      });

      // Financial Summary
      y += 15;
      const subtotal = Number(invoice.subtotalAmount);
      const taxTotal = Number(invoice.taxAmount);
      const discountTotal = Number(invoice.discountAmount);
      const grandTotal = Number(invoice.totalAmount);
      const paidTotal = Number(invoice.paidAmount);
      const balanceDue = Math.max(0, grandTotal - paidTotal);

      doc.rect(340, y, 215, 110).fillAndStroke("#f8fafc", "#cbd5e1");
      let sumY = y + 10;
      doc.font("Helvetica").fontSize(9).fillColor("#475569");

      doc.text("Subtotal:", 350, sumY).text(this.formatCurrency(subtotal), 440, sumY, { align: "right", width: 105 });
      sumY += 16;
      doc.text("Tax Total:", 350, sumY).text(this.formatCurrency(taxTotal), 440, sumY, { align: "right", width: 105 });
      sumY += 16;
      doc.text("Discount:", 350, sumY).text(this.formatCurrency(discountTotal), 440, sumY, { align: "right", width: 105 });
      sumY += 16;
      doc.font("Helvetica-Bold").fillColor("#0f172a").text("Grand Total:", 350, sumY).text(this.formatCurrency(grandTotal), 440, sumY, { align: "right", width: 105 });
      sumY += 16;
      doc.font("Helvetica").fillColor("#166534").text("Paid Amount:", 350, sumY).text(this.formatCurrency(paidTotal), 440, sumY, { align: "right", width: 105 });
      sumY += 16;
      doc.font("Helvetica-Bold").fillColor(balanceDue > 0 ? "#b91c1c" : "#1e293b").text("Balance Due:", 350, sumY).text(this.formatCurrency(balanceDue), 440, sumY, { align: "right", width: 105 });

      // Footer
      doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("Thank you for your business! ValGrow Business OS generated document.", 40, 780, { align: "center", width: 515 });

      doc.end();
    });
  }

  // ============================================================================
  // 2. PURCHASE ORDER PDF
  // ============================================================================
  async generatePurchaseOrderPdf(orderId: string, organizationId: string): Promise<{ buffer: Buffer; filename: string }> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: orderId, organizationId },
      include: {
        organization: true,
        supplier: true,
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            address: true,
            branch: { select: { id: true, name: true, code: true } },
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                description: true,
                unit: { select: { name: true, code: true } },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException("Purchase Order not found");
    }

    const currency = (po.currency || po.organization?.currency || "INR").trim().toUpperCase();

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk: any) => chunks.push(chunk));
      doc.on("end", () =>
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `${po.orderNumber}.pdf`,
        }),
      );
      doc.on("error", (err: any) => reject(err));

      // Header Banner
      doc.rect(40, 40, 515, 60).fill("#0369a1");
      doc.fillColor("#ffffff").fontSize(20).text("PURCHASE ORDER", 55, 55);
      doc.fontSize(10).text(po.organization.name, 350, 55, { align: "right", width: 190 });

      // PO Meta Details
      doc.fillColor("#0f172a").fontSize(10).text(`PO Number:`, 40, 115).font("Helvetica-Bold").text(po.orderNumber, 130, 115);
      doc.font("Helvetica").text(`Order Date:`, 40, 130).text(this.formatDate(po.orderDate), 130, 130);
      doc.text(`Expected Date:`, 40, 145).text(this.formatDate(po.expectedDeliveryDate), 130, 145);
      doc.text(`Status:`, 40, 160).font("Helvetica-Bold").text(po.status, 130, 160);
      doc.font("Helvetica").text(`Currency:`, 40, 175).font("Helvetica-Bold").text(currency, 130, 175);
      if (po.paymentTerms) {
        doc.font("Helvetica").text(`Payment Terms:`, 40, 190).text(po.paymentTerms, 130, 190);
      }

      // Supplier Box
      doc.rect(310, 110, 245, 95).fillAndStroke("#f0f9ff", "#bae6fd");
      doc.fillColor("#0369a1").fontSize(9).font("Helvetica-Bold").text("VENDOR / SUPPLIER:", 320, 118);
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text(po.supplier.name, 320, 130);
      doc.font("Helvetica").fontSize(8).fillColor("#334155");
      let supY = 143;
      if (po.supplier.code) { doc.text(`Code: ${po.supplier.code}`, 320, supY); supY += 10; }
      if (po.supplier.contactPerson) { doc.text(`Contact: ${po.supplier.contactPerson}`, 320, supY); supY += 10; }
      if (po.supplier.phone) { doc.text(`Phone: ${po.supplier.phone}`, 320, supY); supY += 10; }
      if (po.supplier.email) { doc.text(`Email: ${po.supplier.email}`, 320, supY); supY += 10; }
      if (po.supplier.city) { doc.text(`Location: ${po.supplier.city}${po.supplier.country ? `, ${po.supplier.country}` : ""}`, 320, supY); }

      // Warehouse / Delivery Details (if available)
      let y = 215;
      if (po.warehouse) {
        doc.rect(40, y, 515, 22).fillAndStroke("#f8fafc", "#e2e8f0");
        doc.fillColor("#475569").fontSize(8).font("Helvetica-Bold").text("DELIVERY DESTINATION:", 48, y + 6);
        doc.font("Helvetica").text(
          `${po.warehouse.name} (${po.warehouse.code})${po.warehouse.city ? ` — ${po.warehouse.city}` : ""}${po.warehouse.branch?.name ? ` | Branch: ${po.warehouse.branch.name}` : ""}`,
          175,
          y + 6,
          { width: 370 },
        );
        y += 30;
      }

      const drawTableHeader = (atY: number) => {
        doc.rect(40, atY, 515, 20).fill("#e0f2fe");
        doc.fillColor("#0369a1").fontSize(9).font("Helvetica-Bold");
        doc.text("#", 45, atY + 5, { width: 20 });
        doc.text("Product / Description", 70, atY + 5, { width: 190 });
        doc.text("Qty / Unit", 265, atY + 5, { width: 75, align: "right" });
        doc.text("Unit Price", 345, atY + 5, { width: 85, align: "right" });
        doc.text("Total", 435, atY + 5, { width: 110, align: "right" });
      };

      drawTableHeader(y);
      y += 25;

      // Items Rows with auto pagination
      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      po.items.forEach((item, idx) => {
        const itemTotal = Number(item.totalAmount);
        const itemPrice = Number(item.unitPrice);
        const itemQty = Number(item.orderedQty);
        const unitLabel = item.product?.unit?.code || "";

        // Check page boundary
        if (y > 700) {
          doc.addPage({ size: "A4", margin: 40 });
          y = 40;
          drawTableHeader(y);
          y += 25;
        }

        doc.font("Helvetica").fontSize(9).fillColor("#334155");
        doc.text(String(idx + 1), 45, y, { width: 20 });
        doc.font("Helvetica-Bold").text(item.product.name, 70, y, { width: 190 });

        const sublines: string[] = [];
        if (item.product.sku) sublines.push(`SKU: ${item.product.sku}`);
        if (item.product.description) sublines.push(item.product.description);
        if (sublines.length > 0) {
          doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(sublines.join(" • "), 70, y + 11, { width: 190 });
        }

        doc.font("Helvetica").fontSize(9).fillColor("#334155");
        doc.text(`${itemQty} ${unitLabel}`.trim(), 265, y, { width: 75, align: "right" });
        doc.text(this.formatCurrency(itemPrice, currency), 345, y, { width: 85, align: "right" });
        doc.font("Helvetica-Bold").text(this.formatCurrency(itemTotal, currency), 435, y, { width: 110, align: "right" });

        const rowHeight = sublines.length > 0 ? 25 : 18;
        y += rowHeight;
        doc.moveTo(40, y - 3).lineTo(555, y - 3).strokeColor("#f1f5f9").stroke();
      });

      // Totals Box pagination check
      if (y + 110 > 740) {
        doc.addPage({ size: "A4", margin: 40 });
        y = 40;
      } else {
        y += 15;
      }

      // Notes (if available) on the left of totals
      if (po.notes) {
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#0369a1").text("PURCHASE ORDER NOTES:", 40, y);
        doc.font("Helvetica").fontSize(8).fillColor("#475569").text(po.notes, 40, y + 12, { width: 270 });
      }

      const subtotal = Number(po.subtotalAmount);
      const taxTotal = Number(po.taxAmount);
      const discountTotal = Number(po.discountAmount);
      const grandTotal = Number(po.totalAmount);

      doc.rect(330, y, 225, 84).fillAndStroke("#f0f9ff", "#bae6fd");
      let sumY = y + 8;
      doc.font("Helvetica").fontSize(9).fillColor("#475569");
      doc.text("Subtotal:", 340, sumY).text(this.formatCurrency(subtotal, currency), 430, sumY, { align: "right", width: 115 });
      sumY += 16;
      doc.text("Tax Total:", 340, sumY).text(this.formatCurrency(taxTotal, currency), 430, sumY, { align: "right", width: 115 });
      sumY += 16;
      if (discountTotal > 0) {
        doc.text("Discount:", 340, sumY).text(`- ${this.formatCurrency(discountTotal, currency)}`, 430, sumY, { align: "right", width: 115 });
        sumY += 16;
      }
      doc.font("Helvetica-Bold").fillColor("#0369a1").text("Grand Total:", 340, sumY).text(this.formatCurrency(grandTotal, currency), 430, sumY, { align: "right", width: 115 });

      // Footer
      doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("ValGrow Business OS Purchase Order System", 40, 785, { align: "center", width: 515 });

      doc.end();
    });
  }

  // ============================================================================
  // 3. GOODS RECEIPT PDF
  // ============================================================================
  async generateGoodsReceiptPdf(receiptId: string, organizationId: string): Promise<{ buffer: Buffer; filename: string }> {
    const grn = await this.prisma.goodsReceipt.findFirst({
      where: { id: receiptId, organizationId },
      include: {
        organization: true,
        supplier: true,
        warehouse: true,
        receivedBy: true,
        purchaseOrder: true,
        items: {
          include: {
            product: true,
            variant: true,
            location: true,
          },
        },
      },
    });

    if (!grn) {
      throw new NotFoundException("Goods Receipt not found");
    }

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk: any) => chunks.push(chunk));
      doc.on("end", () =>
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `${grn.receiptNumber}.pdf`,
        }),
      );
      doc.on("error", (err: any) => reject(err));

      // Header Banner
      doc.rect(40, 40, 515, 60).fill("#15803d");
      doc.fillColor("#ffffff").fontSize(18).text("GOODS RECEIPT NOTE (GRN)", 55, 55);
      doc.fontSize(10).text(grn.organization.name, 350, 55, { align: "right", width: 190 });

      // GRN Meta Details
      doc.fillColor("#0f172a").fontSize(10).text(`GRN Number:`, 40, 115).font("Helvetica-Bold").text(grn.receiptNumber, 130, 115);
      doc.font("Helvetica").text(`Received Date:`, 40, 130).text(this.formatDate(grn.receivedAt), 130, 130);
      doc.text(`Ref PO #:`, 40, 145).text(grn.purchaseOrder.orderNumber, 130, 145);
      doc.text(`Status:`, 40, 160).font("Helvetica-Bold").text(grn.status, 130, 160);

      // Supplier & Receiver Box
      doc.rect(310, 110, 245, 70).fillAndStroke("#f0fdf4", "#bbf7d0");
      doc.fillColor("#15803d").fontSize(9).font("Helvetica-Bold").text("RECEIPT DETAILS:", 320, 118);
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text(`Supplier: ${grn.supplier.name}`, 320, 130);
      doc.font("Helvetica").fontSize(8).fillColor("#334155");
      doc.text(`Warehouse: ${grn.warehouse.name}`, 320, 143);
      if (grn.receivedBy) {
        doc.text(`Received By: ${grn.receivedBy.firstName} ${grn.receivedBy.lastName}`, 320, 155);
      }

      // Items Table Header
      let y = 200;
      doc.rect(40, y, 515, 20).fill("#dcfce7");
      doc.fillColor("#15803d").fontSize(9).font("Helvetica-Bold");
      doc.text("#", 45, y + 5, { width: 20 });
      doc.text("Product / SKU", 70, y + 5, { width: 180 });
      doc.text("Location", 250, y + 5, { width: 90 });
      doc.text("Received Qty", 340, y + 5, { width: 70, align: "right" });
      doc.text("Unit Cost", 415, y + 5, { width: 60, align: "right" });
      doc.text("Total Cost", 480, y + 5, { width: 65, align: "right" });

      // Items Rows
      y += 25;
      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      grn.items.forEach((item, idx) => {
        const itemTotal = Number(item.totalCost);
        const itemCost = Number(item.unitCost);
        const itemQty = Number(item.receivedQty);

        doc.text(String(idx + 1), 45, y, { width: 20 });
        doc.font("Helvetica-Bold").text(item.product.name, 70, y, { width: 180 });
        if (item.product.sku) {
          doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`SKU: ${item.product.sku}`, 70, y + 10);
        }
        doc.font("Helvetica").fontSize(8).fillColor("#334155");
        doc.text(item.location?.name || "-", 250, y, { width: 90 });
        doc.font("Helvetica").fontSize(9);
        doc.text(String(itemQty), 340, y, { width: 70, align: "right" });
        doc.text(this.formatCurrency(itemCost), 415, y, { width: 60, align: "right" });
        doc.font("Helvetica-Bold").text(this.formatCurrency(itemTotal), 480, y, { width: 65, align: "right" });

        y += item.product.sku ? 24 : 18;
        doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor("#f1f5f9").stroke();
      });

      // Footer
      doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("ValGrow Business OS Stock Receipt Document", 40, 780, { align: "center", width: 515 });

      doc.end();
    });
  }

  // ============================================================================
  // 4. POS RECEIPT PDF
  // ============================================================================
  async generatePosReceiptPdf(saleId: string, organizationId: string): Promise<{ buffer: Buffer; filename: string }> {
    const sale = await this.prisma.pOSSale.findFirst({
      where: { id: saleId, organizationId },
      include: {
        organization: true,
        branch: true,
        warehouse: true,
        customer: true,
        cashier: true,
        payments: true,
        cart: {
          include: {
            items: {
              include: { product: true, variant: true },
            },
          },
        },
        salesOrder: {
          include: {
            items: {
              include: { product: true, variant: true },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException("POS Sale not found");
    }

    const currency = (sale.organization?.currency || "INR").trim().toUpperCase();

    const soItems = (sale.salesOrder?.items || []).map((item) => ({
      name: item.product?.name || "Product",
      price: Number(item.unitPrice),
      qty: Number(item.deliveredQty || item.orderedQty),
      total: Number(item.totalAmount),
    }));
    const cartItems = ((sale as any).cart?.items || []).map((item: any) => ({
      name: item.product?.name || "Product",
      price: Number(item.unitPrice),
      qty: Number(item.quantity),
      total: Number(item.totalAmount),
    }));
    const items = soItems.length > 0 ? soItems : cartItems;

    const itemsCount = items.length;
    const paymentsCount = sale.payments?.length || 1;
    const estimatedHeight = Math.max(450, 240 + itemsCount * 30 + paymentsCount * 18);
    const doc = new PDFDocument({ size: [226, estimatedHeight], margin: 10 });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk: any) => chunks.push(chunk));
      doc.on("end", () =>
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `${sale.receiptNumber}.pdf`,
        }),
      );
      doc.on("error", (err: any) => reject(err));

      const width = 206; // printable width
      let y = 15;

      // Header
      doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text(sale.organization.name, 10, y, { align: "center", width });
      y += 14;
      doc.fontSize(8).font("Helvetica").text(`Branch: ${sale.branch.name}`, 10, y, { align: "center", width });
      y += 11;
      if (sale.branch.city) {
        doc.text(sale.branch.city, 10, y, { align: "center", width });
        y += 11;
      }

      doc.text("================================", 10, y, { align: "center", width });
      y += 11;
      doc.fontSize(9).font("Helvetica-Bold").text("POS RECEIPT", 10, y, { align: "center", width });
      y += 12;
      doc.fontSize(8).font("Helvetica").text(`Receipt #: ${sale.receiptNumber}`, 10, y);
      y += 11;
      doc.text(`Date: ${this.formatDateTime(sale.createdAt)}`, 10, y);
      y += 11;
      doc.text(`Cashier: ${sale.cashier.firstName} ${sale.cashier.lastName}`, 10, y);
      y += 11;
      doc.text(`Customer: ${sale.customer?.name || "Walk-in Customer"}`, 10, y);
      y += 12;

      doc.text("--------------------------------", 10, y, { align: "center", width });
      y += 11;

      // Items
      items.forEach((item: { name: string; price: number; qty: number; total: number }) => {
        doc.font("Helvetica-Bold").fontSize(8).text(item.name, 10, y, { width: 130 });
        doc.text(this.formatCurrency(item.total, currency), 140, y, { align: "right", width: 76 });
        y += 11;
        doc.font("Helvetica").fontSize(7).fillColor("#475569").text(`  ${item.qty} x ${this.formatCurrency(item.price, currency)}`, 10, y);
        doc.fillColor("#0f172a");
        y += 12;
      });

      doc.fontSize(8).text("--------------------------------", 10, y, { align: "center", width });
      y += 11;

      // Totals
      const grandTotal = Number(sale.totalAmount);
      const paidTotal = Number(sale.paidAmount);
      const changeAmt = Number(sale.changeAmount);

      doc.font("Helvetica").fontSize(8);
      doc.text("Subtotal:", 10, y).text(this.formatCurrency(Number(sale.subtotalAmount), currency), 110, y, { align: "right", width: 106 });
      y += 11;
      if (Number(sale.taxAmount) > 0) {
        doc.text("Tax:", 10, y).text(this.formatCurrency(Number(sale.taxAmount), currency), 110, y, { align: "right", width: 106 });
        y += 11;
      }
      if (Number(sale.discountAmount) > 0) {
        doc.text("Discount:", 10, y).text(this.formatCurrency(Number(sale.discountAmount), currency), 110, y, { align: "right", width: 106 });
        y += 11;
      }
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("TOTAL:", 10, y).text(this.formatCurrency(grandTotal, currency), 110, y, { align: "right", width: 106 });
      y += 14;

      // Payments
      doc.font("Helvetica").fontSize(8);
      sale.payments.forEach((p) => {
        doc.text(`Paid (${p.paymentMethod}):`, 10, y).text(this.formatCurrency(Number(p.amount), currency), 110, y, { align: "right", width: 106 });
        y += 11;
      });
      if (changeAmt > 0) {
        doc.text("Change:", 10, y).text(this.formatCurrency(changeAmt, currency), 110, y, { align: "right", width: 106 });
        y += 11;
      }

      y += 10;
      doc.fontSize(8).font("Helvetica-Bold").text("Thank you for shopping with us!", 10, y, { align: "center", width });

      doc.end();
    });
  }
}

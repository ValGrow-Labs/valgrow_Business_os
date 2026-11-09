import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/foundation/list-page";
import { usePOSSale } from "@/hooks/queries/usePOSCheckout";
import { useSalesInvoice } from "@/hooks/queries/useSalesInvoices";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
import { downloadFile } from "@/lib/api-client";
import { toast } from "sonner";
import { Printer, FileText, Loader2, User, CreditCard, Store, Calendar, Receipt } from "lucide-react";

export interface SaleDetailDialogProps {
  saleId: string | null;
  saleType?: "POS_SALE" | "INVOICE" | string | undefined;
  receiptNumber?: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailDialog({
  saleId,
  saleType = "POS_SALE",
  receiptNumber,
  open,
  onOpenChange,
}: SaleDetailDialogProps) {
  const { currencyCode, formatMoney } = useActiveCurrency();
  const [isDownloading, setIsDownloading] = useState(false);

  const isInvoice = saleType === "INVOICE";

  // Fetch either POS sale or sales invoice based on type
  const {
    data: posSale,
    isLoading: isPosLoading,
    isError: isPosError,
  } = usePOSSale(open && !isInvoice && saleId ? saleId : "");

  const {
    data: invoice,
    isLoading: isInvLoading,
    isError: isInvError,
  } = useSalesInvoice(open && isInvoice && saleId ? saleId : "");

  const isLoading = isInvoice ? isInvLoading : isPosLoading;
  const isError = isInvoice ? isInvError : isPosError;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!saleId) return;
    setIsDownloading(true);
    const num =
      receiptNumber ||
      (isInvoice ? invoice?.invoiceNumber : posSale?.receiptNumber) ||
      "Document";

    try {
      if (isInvoice) {
        await downloadFile(`/sales-invoices/${saleId}/pdf`, `${num}.pdf`);
      } else {
        await downloadFile(`/pos/sales/${saleId}/receipt`, `${num}.pdf`);
      }
      toast.success(`${num} downloaded successfully`);
    } catch (err: any) {
      toast.error(err.message || `Failed to download ${num}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Standardized line items
  const items = isInvoice
    ? (invoice?.items || []).map((it) => ({
        id: it.id || it.productId,
        name: it.product?.name || "Product",
        sku: it.product?.sku || it.variant?.sku,
        qty: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice || 0),
        taxRate: Number(it.taxRate || 0),
        taxAmount: Number(it.taxAmount || 0),
        discountAmount: Number(it.discountAmount || 0),
        totalAmount: Number(it.totalAmount || 0),
      }))
    : [
        ...(posSale?.salesOrder?.items || []).map((it: any) => ({
          id: it.id || it.productId,
          name: it.product?.name || "Product",
          sku: it.product?.sku || it.variant?.sku,
          qty: Number(it.deliveredQty || it.orderedQty || 0),
          unitPrice: Number(it.unitPrice || 0),
          taxRate: Number(it.taxRate || 0),
          taxAmount: Number(it.taxAmount || 0),
          discountAmount: Number(it.discountAmount || 0),
          totalAmount: Number(it.totalAmount || 0),
        })),
        ...((!posSale?.salesOrder?.items || posSale.salesOrder.items.length === 0) &&
        posSale?.cart?.items
          ? posSale.cart.items.map((it: any) => ({
              id: it.id || it.productId,
              name: it.product?.name || "Product",
              sku: it.product?.sku || it.variant?.sku,
              qty: Number(it.quantity || 0),
              unitPrice: Number(it.unitPrice || 0),
              taxRate: Number(it.taxRate || 0),
              taxAmount: Number(it.taxAmount || 0),
              discountAmount: Number(it.discountAmount || 0),
              totalAmount: Number(it.totalAmount || 0),
            }))
          : []),
      ];

  const docNumber =
    (isInvoice ? invoice?.invoiceNumber : posSale?.receiptNumber) || receiptNumber || "---";
  const docStatus = (isInvoice ? invoice?.status : posSale?.status) || "COMPLETED";
  const docDate = (isInvoice ? invoice?.invoiceDate : posSale?.createdAt) || "";
  const customerName =
    (isInvoice ? invoice?.customer?.name : posSale?.customer?.name) || "Walk-in Retail Customer";
  const customerCode = isInvoice ? invoice?.customer?.customerCode : posSale?.customer?.customerCode;
  const branchName = (!isInvoice && posSale?.branch?.name) || (isInvoice ? "Direct B2B Sales" : "Main Store");
  const cashierName =
    !isInvoice && posSale?.cashier
      ? `${posSale.cashier.firstName} ${posSale.cashier.lastName}`
      : undefined;

  const subtotal = Number(isInvoice ? invoice?.subtotalAmount : posSale?.subtotalAmount) || 0;
  const tax = Number(isInvoice ? invoice?.taxAmount : posSale?.taxAmount) || 0;
  const discount = Number(isInvoice ? invoice?.discountAmount : posSale?.discountAmount) || 0;
  const total = Number(isInvoice ? invoice?.totalAmount : posSale?.totalAmount) || 0;
  const paid = Number(isInvoice ? invoice?.paidAmount : posSale?.paidAmount) || 0;
  const change = Number(!isInvoice ? posSale?.changeAmount : 0) || 0;

  const payments = isInvoice
    ? (invoice?.customerPayments || []).map((cp: any) => ({
        method: cp.paymentMethod || "ACCOUNT",
        amount: Number(cp.amount || 0),
      }))
    : (posSale?.payments || []).map((p: any) => ({
        method: p.paymentMethod || "CASH",
        amount: Number(p.amount || 0),
      }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .print-sale-container, .print-sale-container * {
              visibility: visible !important;
            }
            .print-sale-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 1.5rem !important;
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <DialogHeader className="no-print">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg font-bold">
                {isInvoice ? "Invoice Details" : "POS Sale Receipt"}: {docNumber}
              </DialogTitle>
              <StatusBadge value={docStatus} />
            </div>
          </div>
          <DialogDescription>
            {isInvoice
              ? "Commercial sales invoice specification, line pricing, and payment status."
              : "Completed point-of-sale retail transaction and audit record."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading transaction details...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-sm font-semibold text-destructive">Could not load sale details</p>
            <p className="text-xs text-muted-foreground">
              The record could not be retrieved or has restricted access.
            </p>
          </div>
        ) : (
          <div className="print-sale-container space-y-5 py-2 text-sm">
            {/* Header Document Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
                  {isInvoice ? "Commercial Tax Invoice" : "Retail Point of Sale"}
                </span>
                <span className="text-xl font-bold font-mono text-foreground">{docNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={docStatus} />
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                  {currencyCode || "INR"}
                </span>
              </div>
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-semibold text-foreground">{customerName}</span>
                  {customerCode && <span className="font-mono">({customerCode})</span>}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Store className="h-3.5 w-3.5" />
                  <span>Channel: {branchName}</span>
                </div>
              </div>
              <div className="space-y-1.5 sm:text-right">
                <div className="flex sm:justify-end items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{docDate ? new Date(docDate).toLocaleString() : "Date N/A"}</span>
                </div>
                {cashierName && (
                  <div className="text-muted-foreground">
                    <span>Cashier: <strong className="text-foreground">{cashierName}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Line Items ({items.length})
              </h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground border-b font-medium">
                    <tr>
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Tax</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.length > 0 ? (
                      items.map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-muted/10">
                          <td className="p-2 text-center text-muted-foreground">{idx + 1}</td>
                          <td className="p-2">
                            <div className="font-medium text-foreground">{it.name}</div>
                            {it.sku && (
                              <div className="text-[10px] text-muted-foreground font-mono">
                                SKU: {it.sku}
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-right font-medium">{it.qty}</td>
                          <td className="p-2 text-right tabular text-muted-foreground">
                            {formatMoney(it.unitPrice)}
                          </td>
                          <td className="p-2 text-right tabular text-muted-foreground">
                            {it.taxRate}%
                          </td>
                          <td className="p-2 text-right tabular font-semibold text-foreground">
                            {formatMoney(it.totalAmount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          No line items recorded for this transaction.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Payments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Payments Tendered */}
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Payment Information</span>
                </div>
                {payments.length > 0 ? (
                  payments.map((p: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-muted-foreground">
                      <span>Method: <strong className="text-foreground">{p.method}</strong></span>
                      <span className="font-semibold text-foreground">{formatMoney(p.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Paid Total:</span>
                    <span className="font-semibold text-foreground">{formatMoney(paid)}</span>
                  </div>
                )}
                {change > 0 && (
                  <div className="flex justify-between text-success font-medium border-t pt-1">
                    <span>Change Returned:</span>
                    <span>{formatMoney(change)}</span>
                  </div>
                )}
              </div>

              {/* Financial Totals */}
              <div className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatMoney(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount:</span>
                    <span>-{formatMoney(discount)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Amount:</span>
                    <span className="font-medium">{formatMoney(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t pt-1.5 text-foreground">
                  <span>Grand Total:</span>
                  <span className="text-primary">{formatMoney(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="no-print flex items-center justify-between sm:justify-between w-full pt-3 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || isError}
              className="gap-1.5 text-xs"
              title="Print Receipt"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={isLoading || isError || isDownloading}
              onClick={handleDownload}
              className="gap-1.5 text-xs"
              title="Download PDF"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span>Download PDF</span>
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

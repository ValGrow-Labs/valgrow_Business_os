import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useSupplierInvoices,
  useCreateSupplierInvoice,
  useThreeWayMatch,
} from "@/hooks/queries/useSupplierInvoices";
import { useSuppliers } from "@/hooks/queries/useSuppliers";
import { usePurchaseOrders, usePurchaseOrder } from "@/hooks/queries/usePurchaseOrders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const title = "Supplier Invoices";
const description =
  "Vendor invoices, payables registration, and 3-way matching against POs and GRNs.";

export const Route = createFileRoute("/supplier-invoices")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SupplierInvoicesPage,
});

function SupplierInvoicesPage() {
  const { data: invoices } = useSupplierInvoices();
  const { data: suppliers } = useSuppliers();
  const { data: orders } = usePurchaseOrders();

  const createInvoiceMutation = useCreateSupplierInvoice();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedMatchInvoiceId, setSelectedMatchInvoiceId] = useState<string | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [poId, setPOId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  const handlePOSelect = (id: string) => {
    setPOId(id);
    const po = orders?.find((o) => o.id === id);
    if (po) {
      setSupplierId(po.supplierId);
      setSubtotalAmount(Number(po.subtotalAmount || 0));
      setTaxAmount(Number(po.taxAmount || 0));
    }
  };

  const handleCreate = async () => {
    if (!supplierId || !invoiceNumber || !invoiceDate || !dueDate) return;
    const sub = Number(subtotalAmount);
    const tax = Number(taxAmount);
    await createInvoiceMutation.mutateAsync({
      supplierId,
      purchaseOrderId: poId || undefined,
      invoiceNumber,
      invoiceDate,
      dueDate,
      subtotalAmount: sub,
      taxAmount: tax,
      totalAmount: sub + tax,
    });
    setIsAddOpen(false);
    setInvoiceNumber("");
  };

  const columns: Column<ListRow>[] = [
    { key: "invoiceNumber", header: "Invoice #" },
    { key: "supplier", header: "Supplier" },
    { key: "poNumber", header: "Purchase Order" },
    { key: "invoiceDate", header: "Invoice Date" },
    { key: "dueDate", header: "Due Date" },
    { key: "totalAmount", header: "Total Amount" },
    { key: "paidAmount", header: "Paid Amount" },
    { key: "outstanding", header: "Outstanding" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = invoices?.find((inv) => inv.id === r["id"]);
        if (!item) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => setSelectedMatchInvoiceId(item.id)}
            >
              <Scale className="mr-1 h-3.5 w-3.5" /> 3-Way Match
            </Button>
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = invoices
    ? invoices.map((inv) => {
        const total = Number(inv.totalAmount);
        const paid = Number(inv.paidAmount);
        const outstanding = total - paid;
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          supplier: inv.supplier ? inv.supplier.name : "N/A",
          poNumber: inv.purchaseOrder ? inv.purchaseOrder.orderNumber : "N/A",
          invoiceDate: new Date(inv.invoiceDate).toLocaleDateString(),
          dueDate: new Date(inv.dueDate).toLocaleDateString(),
          totalAmount: `₹${total.toLocaleString("en-IN")}`,
          paidAmount: `₹${paid.toLocaleString("en-IN")}`,
          outstanding: `₹${outstanding.toLocaleString("en-IN")}`,
          status: inv.status,
        };
      })
    : [];

  const stats = [
    { label: "Total Invoices", value: String(invoices?.length || 0) },
    {
      label: "Unpaid Invoices",
      value: String(invoices?.filter((i) => i.status === "UNPAID").length || 0),
    },
    {
      label: "Total Balance Due",
      value: `₹${invoices?.reduce((s, i) => s + (Number(i.totalAmount) - Number(i.paidAmount)), 0).toLocaleString("en-IN") || 0}`,
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Purchasing & Payables"
        actionLabel="New Invoice"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Record Supplier Invoice
            </Button>
          </div>
        }
      />

      {/* Create Invoice Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Record Supplier Invoice</DialogTitle>
            <DialogDescription>
              Register an operational vendor bill linked to a Purchase Order.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Link Purchase Order (Optional)</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={poId}
                onChange={(e) => handlePOSelect(e.target.value)}
              >
                <option value="">Select PO</option>
                {orders?.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.orderNumber} — {po.supplier?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Supplier *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select Supplier</option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Vendor Invoice # *</Label>
              <Input
                placeholder="INV-2026-99"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Invoice Date *</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Subtotal Amount (₹) *</Label>
              <Input
                type="number"
                value={subtotalAmount}
                onChange={(e) => setSubtotalAmount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tax Amount (₹)</Label>
              <Input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createInvoiceMutation.isPending || !supplierId || !invoiceNumber}
            >
              Save Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Three-Way Match Modal */}
      {selectedMatchInvoiceId && (
        <ThreeWayMatchModal
          invoiceId={selectedMatchInvoiceId}
          onClose={() => setSelectedMatchInvoiceId(null)}
        />
      )}
    </>
  );
}

function ThreeWayMatchModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const { data: matchResult, isLoading } = useThreeWayMatch(invoiceId);

  return (
    <Dialog open={Boolean(invoiceId)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" /> Three-Way Match Verification
          </DialogTitle>
          <DialogDescription>
            Automated reconciliation between Purchase Order (PO), Goods Receipts (GRN), and Supplier
            Invoice.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Running 3-way match audit…
          </div>
        ) : matchResult ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-3 rounded border bg-secondary/20">
              <span className="font-semibold text-sm">Match Status</span>
              {matchResult.matched ? (
                <Badge className="bg-success text-success-foreground hover:bg-success">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> PERFECT MATCH
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3.5 w-3.5" /> MISMATCH DETECTED
                </Badge>
              )}
            </div>

            {!matchResult.matched && matchResult.mismatches.length > 0 && (
              <div className="border border-destructive/30 rounded p-3 bg-destructive/10 text-xs space-y-1">
                <div className="font-semibold text-destructive">Mismatches Found:</div>
                <ul className="list-disc pl-4 space-y-1">
                  {matchResult.mismatches.map((m, idx) => (
                    <li key={idx} className="text-destructive-foreground">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {matchResult.summary && (
              <div className="grid gap-3 sm:grid-cols-2 text-xs border rounded p-3">
                <div>
                  <span className="text-muted-foreground block">PO Total</span>
                  <span className="font-semibold text-sm">
                    ₹{Number(matchResult.summary.poTotal).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Invoice Total</span>
                  <span className="font-semibold text-sm">
                    ₹{Number(matchResult.summary.invoiceTotal).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Ordered Qty</span>
                  <span className="font-semibold">{matchResult.summary.totalOrdered} units</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Received Qty</span>
                  <span className="font-semibold">{matchResult.summary.totalReceived} units</span>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close Audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

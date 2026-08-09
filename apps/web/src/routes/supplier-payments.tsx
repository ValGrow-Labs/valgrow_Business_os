import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useSupplierPayments, useCreateSupplierPayment } from "@/hooks/queries/useSupplierPayments";
import { useSuppliers } from "@/hooks/queries/useSuppliers";
import { useSupplierInvoices, useSupplierInvoice } from "@/hooks/queries/useSupplierInvoices";
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
import { Plus } from "lucide-react";

const title = "Supplier Payments";
const description =
  "Vendor disbursements, cheque/bank transfers, and accounts payable settlements.";

export const Route = createFileRoute("/supplier-payments")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SupplierPaymentsPage,
});

function SupplierPaymentsPage() {
  const { data: payments } = useSupplierPayments();
  const { data: suppliers } = useSuppliers();
  const { data: invoices } = useSupplierInvoices();

  const createPaymentMutation = useCreateSupplierPayment();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "UPI"
  >("BANK_TRANSFER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const { data: selectedInvoice } = useSupplierInvoice(invoiceId);

  const outstanding = selectedInvoice
    ? Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount)
    : 0;

  const handleInvoiceSelect = (id: string) => {
    setInvoiceId(id);
    const inv = invoices?.find((i) => i.id === id);
    if (inv) {
      setSupplierId(inv.supplierId);
      const rem = Number(inv.totalAmount) - Number(inv.paidAmount);
      setAmount(rem);
    }
  };

  const handleCreate = async () => {
    if (!supplierId || amount <= 0) return;
    if (selectedInvoice && amount > outstanding) return;

    await createPaymentMutation.mutateAsync({
      supplierId,
      supplierInvoiceId: invoiceId || undefined,
      amount: Number(amount),
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
    });
    setIsAddOpen(false);
    setAmount(0);
    setReferenceNumber("");
  };

  const columns: Column<ListRow>[] = [
    { key: "paymentNumber", header: "Payment #" },
    { key: "supplier", header: "Supplier" },
    { key: "invoiceNumber", header: "Invoice #" },
    { key: "amount", header: "Amount Paid" },
    { key: "paymentMethod", header: "Method" },
    { key: "referenceNumber", header: "Ref / Txn #" },
    { key: "paymentDate", header: "Payment Date" },
  ];

  const rows: ListRow[] = payments
    ? payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        supplier: p.supplier ? p.supplier.name : "N/A",
        invoiceNumber: p.invoice ? p.invoice.invoiceNumber : "Direct / Advance",
        amount: `₹${Number(p.amount).toLocaleString("en-IN")}`,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber || "N/A",
        paymentDate: new Date(p.paymentDate).toLocaleDateString(),
      }))
    : [];

  const stats = [
    { label: "Total Disbursements", value: String(payments?.length || 0) },
    {
      label: "Total Amount Paid",
      value: `₹${payments?.reduce((s, p) => s + Number(p.amount), 0).toLocaleString("en-IN") || 0}`,
    },
    {
      label: "Bank Transfers",
      value: String(payments?.filter((p) => p.paymentMethod === "BANK_TRANSFER").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Purchasing & Payables"
        actionLabel="Record Payment"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </div>
        }
      />

      {/* Record Payment Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Record Supplier Payment</DialogTitle>
            <DialogDescription>
              Process vendor payment against an outstanding supplier invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Link Supplier Invoice (Optional)</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={invoiceId}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
              >
                <option value="">Direct / Advance Payment</option>
                {invoices
                  ?.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED")
                  .map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.supplier?.name} (Outs: ₹
                      {(Number(inv.totalAmount) - Number(inv.paidAmount)).toLocaleString("en-IN")})
                    </option>
                  ))}
              </select>
            </div>

            {selectedInvoice && (
              <div className="sm:col-span-2 grid grid-cols-3 text-xs border rounded p-2.5 bg-secondary/20">
                <div>
                  <span className="text-muted-foreground block">Invoice Total</span>
                  <span className="font-semibold">
                    ₹{Number(selectedInvoice.totalAmount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Already Paid</span>
                  <span className="font-semibold text-success">
                    ₹{Number(selectedInvoice.paidAmount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Outstanding</span>
                  <span className="font-semibold text-warning">
                    ₹{outstanding.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

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
              <Label>Payment Method *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS/IMPS)</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="UPI">UPI</option>
                <option value="CASH">CASH</option>
                <option value="CREDIT_CARD">CREDIT CARD</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Payment Amount (₹) *</Label>
              <Input
                type="number"
                min={0.01}
                max={selectedInvoice ? outstanding : undefined}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              {selectedInvoice && amount > outstanding && (
                <span className="text-xs text-destructive">Amount exceeds remaining balance!</span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reference / Transaction #</Label>
              <Input
                placeholder="e.g. UTR-99887766"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createPaymentMutation.isPending ||
                !supplierId ||
                amount <= 0 ||
                (Boolean(selectedInvoice) && amount > outstanding)
              }
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

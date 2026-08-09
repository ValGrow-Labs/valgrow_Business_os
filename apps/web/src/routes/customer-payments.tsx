import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useCustomerPayments, useCreateCustomerPayment } from "@/hooks/queries/useCustomerPayments";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useSalesInvoices } from "@/hooks/queries/useSalesInvoices";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CreditCard } from "lucide-react";

const title = "Customer Payments";
const description = "Record customer payment receipts, bank transfers, and invoice reconciliation.";

export const Route = createFileRoute("/customer-payments")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: CustomerPaymentsPage,
});

function CustomerPaymentsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canPayment = permissions.includes("sales.payment");

  const { data: paymentsData, isLoading } = useCustomerPayments();
  const { data: customers } = useCustomers();
  const { data: invoices } = useSalesInvoices();

  const createCustomerPaymentMutation = useCreateCustomerPayment();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [salesInvoiceId, setSalesInvoiceId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const selectedInvoice = invoices?.find((i) => i.id === salesInvoiceId);
  const invoiceTotal = Number(selectedInvoice?.totalAmount || 0);
  const invoicePaid = Number(selectedInvoice?.paidAmount || 0);
  const invoiceOutstanding = invoiceTotal - invoicePaid;

  const handleInvoiceSelect = (invId: string) => {
    setSalesInvoiceId(invId);
    const inv = invoices?.find((i) => i.id === invId);
    if (inv) {
      setCustomerId(inv.customerId);
      const remaining = Number(inv.totalAmount) - Number(inv.paidAmount || 0);
      setAmount(Math.max(0, remaining));
    }
  };

  const resetForm = () => {
    setCustomerId("");
    setSalesInvoiceId("");
    setAmount(0);
    setPaymentMethod("BANK_TRANSFER");
    setReferenceNumber("");
    setNotes("");
    setErrorMsg(null);
  };

  const handleCreate = async () => {
    if (!customerId || amount <= 0) {
      setErrorMsg("Please select a customer and enter a positive payment amount.");
      return;
    }
    setErrorMsg(null);
    try {
      await createCustomerPaymentMutation.mutateAsync({
        customerId,
        salesInvoiceId: salesInvoiceId || undefined,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record customer payment");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "paymentNumber", header: "Receipt #" },
    { key: "customerName", header: "Customer" },
    { key: "invoiceNumber", header: "Invoice #" },
    { key: "paymentDate", header: "Date" },
    { key: "paymentMethod", header: "Method" },
    { key: "referenceNumber", header: "Reference" },
    { key: "amount", header: "Amount Received" },
  ];

  const rows: ListRow[] = paymentsData
    ? paymentsData.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        customerName: p.customer?.name || "N/A",
        invoiceNumber: p.invoice?.invoiceNumber || "Unallocated",
        paymentDate: new Date(p.paymentDate).toLocaleDateString(),
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber || "N/A",
        amount: `₹${Number(p.amount).toLocaleString("en-IN")}`,
      }))
    : [];

  const totalCollected = paymentsData ? paymentsData.reduce((s, p) => s + Number(p.amount), 0) : 0;

  const stats = [
    { label: "Total Receipts", value: isLoading ? "…" : String(paymentsData?.length || 0) },
    {
      label: "Total Collected",
      value: isLoading ? "…" : `₹${totalCollected.toLocaleString("en-IN")}`,
    },
    {
      label: "Default Channel",
      value: "Bank Transfer",
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Sales Receipts"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          canPayment ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Record Payment Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Record Customer Payment</DialogTitle>
            <DialogDescription>
              Register payment received against an open invoice or customer balance.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payCust">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="payCust">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payInv">Open Sales Invoice</Label>
              <Select value={salesInvoiceId} onValueChange={handleInvoiceSelect}>
                <SelectTrigger id="payInv">
                  <SelectValue placeholder="Select Invoice (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {invoices
                    ?.filter((i) => ["POSTED", "PARTIALLY_PAID"].includes(i.status))
                    .map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.invoiceNumber} — {i.customer?.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInvoice && (
              <div className="col-span-2 rounded border bg-muted/20 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total:</span>
                  <span className="font-semibold">₹{invoiceTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Paid:</span>
                  <span className="font-semibold text-success">
                    ₹{invoicePaid.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-muted-foreground">Outstanding Balance:</span>
                  <span className="font-semibold text-warning">
                    ₹{invoiceOutstanding.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payAmount">Payment Amount (₹) *</Label>
              <Input
                id="payAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payMethod">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="ONLINE">Online Payment</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payRef">Reference / Transaction #</Label>
              <Input
                id="payRef"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TXN-998877"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payNotes">Notes</Label>
              <Input
                id="payNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createCustomerPaymentMutation.isPending || !customerId || amount <= 0}
            >
              {createCustomerPaymentMutation.isPending ? "Recording…" : "Save Payment Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

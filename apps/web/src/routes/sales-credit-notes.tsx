import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useSalesCreditNotes,
  useCreateSalesCreditNote,
  useIssueSalesCreditNote,
  useApplySalesCreditNote,
  useCancelSalesCreditNote,
  type SalesCreditNoteItem,
} from "@/hooks/queries/useSalesCreditNotes";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useSalesInvoices } from "@/hooks/queries/useSalesInvoices";
import { useSalesReturns } from "@/hooks/queries/useSalesReturns";
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
import { Plus, Calculator, CheckCircle2, Send } from "lucide-react";

const title = "Sales Credit Notes";
const description = "Customer credit notes, return refunds, and invoice adjustments.";

export const Route = createFileRoute("/sales-credit-notes")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SalesCreditNotesPage,
});

function SalesCreditNotesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canInvoice = permissions.includes("sales.invoice");
  const canUpdate = permissions.includes("sales.update");

  const { data: creditNotesData, isLoading } = useSalesCreditNotes();
  const { data: customers } = useCustomers();
  const { data: invoices } = useSalesInvoices();
  const { data: returns } = useSalesReturns();

  const createCreditNoteMutation = useCreateSalesCreditNote();
  const issueCreditNoteMutation = useIssueSalesCreditNote();
  const applyCreditNoteMutation = useApplySalesCreditNote();
  const cancelCreditNoteMutation = useCancelSalesCreditNote();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [salesInvoiceId, setSalesInvoiceId] = useState("");
  const [salesReturnId, setSalesReturnId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");

  const resetForm = () => {
    setCustomerId("");
    setSalesInvoiceId("");
    setSalesReturnId("");
    setAmount(0);
    setReason("");
    setErrorMsg(null);
  };

  const handleReturnSelect = (srId: string) => {
    setSalesReturnId(srId);
    const sr = returns?.find((r) => r.id === srId);
    if (sr) {
      setCustomerId(sr.customerId);
      if (sr.salesInvoiceId) setSalesInvoiceId(sr.salesInvoiceId);
      setAmount(Number(sr.totalRefundAmount || 0));
    }
  };

  const handleCreate = async () => {
    if (!customerId || amount <= 0) {
      setErrorMsg("Please select a customer and specify a positive credit note amount.");
      return;
    }
    setErrorMsg(null);
    try {
      await createCreditNoteMutation.mutateAsync({
        customerId,
        salesInvoiceId: salesInvoiceId || undefined,
        salesReturnId: salesReturnId || undefined,
        amount: Number(amount),
        reason: reason || undefined,
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create sales credit note");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "creditNoteNumber", header: "Credit Note #" },
    { key: "customerName", header: "Customer" },
    { key: "invoiceNumber", header: "Ref Invoice" },
    { key: "returnNumber", header: "Ref Return" },
    { key: "creditDate", header: "Date" },
    { key: "amount", header: "Amount" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const cn = creditNotesData?.find((item) => item.id === r["id"]);
        if (!cn) return null;

        return (
          <div className="flex items-center gap-1">
            {cn.status === "DRAFT" && canUpdate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => issueCreditNoteMutation.mutate(cn.id)}
                >
                  <Send className="mr-1 h-3 w-3" /> Issue
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => cancelCreditNoteMutation.mutate(cn.id)}
                >
                  Cancel
                </Button>
              </>
            )}

            {cn.status === "ISSUED" && canUpdate && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={() => applyCreditNoteMutation.mutate(cn.id)}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Apply Credit
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = creditNotesData
    ? creditNotesData.map((cn) => ({
        id: cn.id,
        creditNoteNumber: cn.creditNoteNumber,
        customerName: cn.customer?.name || "N/A",
        invoiceNumber: cn.salesInvoice?.invoiceNumber || "N/A",
        returnNumber: cn.salesReturn?.returnNumber || "N/A",
        creditDate: new Date(cn.creditDate).toLocaleDateString(),
        amount: `₹${Number(cn.totalAmount).toLocaleString("en-IN")}`,
        status: cn.status,
      }))
    : [];

  const stats = [
    { label: "Total Credit Notes", value: isLoading ? "…" : String(creditNotesData?.length || 0) },
    {
      label: "Issued (Pending Apply)",
      value: isLoading
        ? "…"
        : String(creditNotesData?.filter((c) => c.status === "ISSUED").length || 0),
    },
    {
      label: "Applied",
      value: isLoading
        ? "…"
        : String(creditNotesData?.filter((c) => c.status === "APPLIED").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Sales Credit Adjustments"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          canInvoice ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Issue Credit Note
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Sales Credit Note Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Issue Sales Credit Note</DialogTitle>
            <DialogDescription>
              Record a credit memo for customer return refunds or billing adjustments.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnCust">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="cnCust">
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
              <Label htmlFor="cnSR">From Sales Return</Label>
              <Select value={salesReturnId} onValueChange={handleReturnSelect}>
                <SelectTrigger id="cnSR">
                  <SelectValue placeholder="Select Return (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {returns
                    ?.filter((r) => r.status === "POSTED")
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.returnNumber} — {r.customer?.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnInv">Ref Sales Invoice</Label>
              <Select value={salesInvoiceId} onValueChange={setSalesInvoiceId}>
                <SelectTrigger id="cnInv">
                  <SelectValue placeholder="Select Invoice (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {invoices?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.invoiceNumber} — {i.customer?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnAmt">Credit Amount (₹) *</Label>
              <Input
                id="cnAmt"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Amount"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="cnReason">Reason / Remarks</Label>
              <Input
                id="cnReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Refund for damaged shipment item"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createCreditNoteMutation.isPending || !customerId || amount <= 0}
            >
              {createCreditNoteMutation.isPending ? "Creating…" : "Save Draft Credit Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useQuotations,
  useCreateQuotation,
  useSendQuotation,
  useAcceptQuotation,
  useRejectQuotation,
  useExpireQuotation,
  useCancelQuotation,
  useConvertQuotationToSO,
  type QuotationItem,
} from "@/hooks/queries/useQuotations";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useProducts } from "@/hooks/queries/useProducts";
import { useProductVariants } from "@/hooks/queries/useProductVariants";
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
import {
  Plus,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";

const title = "Quotations";
const description = "Sales proposals, price quotes, customer approvals, and order conversions.";

export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: QuotationsPage,
});

function QuotationsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("sales.create");
  const canUpdate = permissions.includes("sales.update");
  const canApprove = permissions.includes("sales.approve");

  const { data: quotationsData, isLoading } = useQuotations();
  const { data: customers } = useCustomers();
  const { data: warehouses } = useWarehouses();
  const { data: productsRes } = useProducts();
  const products = productsRes?.data;
  const { data: variants } = useProductVariants();

  const createQuotationMutation = useCreateQuotation();
  const sendQuotationMutation = useSendQuotation();
  const acceptQuotationMutation = useAcceptQuotation();
  const rejectQuotationMutation = useRejectQuotation();
  const expireQuotationMutation = useExpireQuotation();
  const cancelQuotationMutation = useCancelQuotation();
  const convertQuotationMutation = useConvertQuotationToSO();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  // Line items state
  const [items, setItems] = useState<
    Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
      taxRate?: number;
    }>
  >([{ productId: "", variantId: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 }]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: "", variantId: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 },
    ]);
  };

  const removeItemRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const updated = { ...item, [field]: value };
          if (field === "productId") {
            updated.variantId = "";
            const prod = products?.find((p) => p.id === value);
            if (prod && prod.costPrice) {
              updated.unitPrice = Number(prod.costPrice) * 1.5; // Default markup hint
            }
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const resetForm = () => {
    setCustomerId("");
    setWarehouseId("");
    setExpiryDate("");
    setNotes("");
    setItems([
      { productId: "", variantId: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 },
    ]);
    setErrorMsg(null);
  };

  const handleCreate = async () => {
    if (!customerId || !warehouseId || items.some((i) => !i.productId || i.quantity <= 0)) {
      setErrorMsg("Please select a customer, warehouse, and valid product line items.");
      return;
    }
    setErrorMsg(null);
    try {
      await createQuotationMutation.mutateAsync({
        customerId,
        warehouseId,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountAmount: Number(i.discountAmount || 0),
          taxRate: Number(i.taxRate || 0),
        })),
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create quotation");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "quotationNumber", header: "Quotation #" },
    { key: "customerName", header: "Customer" },
    { key: "quotationDate", header: "Date" },
    { key: "subtotal", header: "Subtotal" },
    { key: "tax", header: "Tax" },
    { key: "total", header: "Total Amount" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const q = quotationsData?.find((item) => item.id === r["id"]);
        if (!q) return null;

        return (
          <div className="flex items-center gap-1">
            {q.status === "DRAFT" && canUpdate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => sendQuotationMutation.mutate({ id: q.id })}
                >
                  <Send className="mr-1 h-3 w-3" /> Send
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => cancelQuotationMutation.mutate({ id: q.id })}
                >
                  Cancel
                </Button>
              </>
            )}

            {q.status === "SENT" && canApprove && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-success border-success/30 hover:bg-success/10"
                  onClick={() => acceptQuotationMutation.mutate({ id: q.id })}
                >
                  <CheckCircle className="mr-1 h-3 w-3" /> Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => rejectQuotationMutation.mutate({ id: q.id })}
                >
                  <XCircle className="mr-1 h-3 w-3" /> Reject
                </Button>
              </>
            )}

            {q.status === "ACCEPTED" && canUpdate && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={() => convertQuotationMutation.mutate({ id: q.id })}
              >
                <ArrowRight className="mr-1 h-3 w-3" /> Convert to SO
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = quotationsData
    ? quotationsData.map((q) => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        customerName: q.customer?.name || "N/A",
        quotationDate: new Date(q.quotationDate).toLocaleDateString(),
        subtotal: `₹${Number(q.subtotalAmount).toLocaleString("en-IN")}`,
        tax: `₹${Number(q.taxAmount).toLocaleString("en-IN")}`,
        total: `₹${Number(q.totalAmount).toLocaleString("en-IN")}`,
        status: q.status,
      }))
    : [];

  const stats = [
    { label: "Total Quotations", value: isLoading ? "…" : String(quotationsData?.length || 0) },
    {
      label: "Pending Sent",
      value: isLoading
        ? "…"
        : String(quotationsData?.filter((q) => q.status === "SENT").length || 0),
    },
    {
      label: "Converted to SO",
      value: isLoading
        ? "…"
        : String(quotationsData?.filter((q) => q.status === "CONVERTED").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Sales Lifecycle"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> New Quotation
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Quotation Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sales Quotation</DialogTitle>
            <DialogDescription>Prepare a formal price quotation for a customer.</DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cust">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="cust">
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
              <Label htmlFor="wh">Fulfillment Warehouse *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger id="wh">
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Special Terms</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Valid for 30 days"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Quotation Items</h4>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            {items.map((row, idx) => {
              const selectedProductVariants = variants?.filter(
                (v) => v.productId === row.productId,
              );
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center border rounded p-2 bg-muted/20"
                >
                  <div className="col-span-3">
                    <Select
                      value={row.productId}
                      onValueChange={(val) => updateItemRow(idx, "productId", val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Product *" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Select
                      value={row.variantId || ""}
                      onValueChange={(val) => updateItemRow(idx, "variantId", val)}
                      disabled={!row.productId || !selectedProductVariants?.length}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Variant (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProductVariants?.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} ({v.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => updateItemRow(idx, "quantity", Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="Price (₹)"
                      value={row.unitPrice}
                      onChange={(e) => updateItemRow(idx, "unitPrice", Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createQuotationMutation.isPending || !customerId || !warehouseId}
            >
              {createQuotationMutation.isPending ? "Creating…" : "Save Draft Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

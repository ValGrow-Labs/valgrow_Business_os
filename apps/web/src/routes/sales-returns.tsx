import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useSalesReturns,
  useCreateSalesReturn,
  usePostSalesReturn,
  useCancelSalesReturn,
  type SalesReturnItem,
} from "@/hooks/queries/useSalesReturns";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useLocations } from "@/hooks/queries/useLocations";
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
import { Plus, Trash2, ArrowRightLeft, AlertTriangle } from "lucide-react";

const title = "Sales Returns";
const description = "Customer returns, damaged item processing, and stock restock management.";

export const Route = createFileRoute("/sales-returns")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SalesReturnsPage,
});

function SalesReturnsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canReturn = permissions.includes("sales.return");

  const { data: salesReturnsData, isLoading } = useSalesReturns();
  const { data: customers } = useCustomers();
  const { data: warehouses } = useWarehouses();
  const { data: locations } = useLocations();
  const { data: productsRes } = useProducts();
  const products = productsRes?.data;
  const { data: variants } = useProductVariants();

  const createSalesReturnMutation = useCreateSalesReturn();
  const postSalesReturnMutation = usePostSalesReturn();
  const cancelSalesReturnMutation = useCancelSalesReturn();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [confirmPostReturn, setConfirmPostReturn] = useState<SalesReturnItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");

  const selectedWarehouseLocations = locations?.filter((l) => l.warehouseId === warehouseId);

  const [items, setItems] = useState<
    Array<{
      productId: string;
      variantId?: string;
      locationId: string;
      originalQty: number;
      returnedQty: number;
      reason: string;
      refundAmount: number;
    }>
  >([
    {
      productId: "",
      variantId: "",
      locationId: "",
      originalQty: 10,
      returnedQty: 1,
      reason: "DAMAGED",
      refundAmount: 0,
    },
  ]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        variantId: "",
        locationId: "",
        originalQty: 10,
        returnedQty: 1,
        reason: "DAMAGED",
        refundAmount: 0,
      },
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
    setNotes("");
    setItems([
      {
        productId: "",
        variantId: "",
        locationId: "",
        originalQty: 10,
        returnedQty: 1,
        reason: "DAMAGED",
        refundAmount: 0,
      },
    ]);
    setErrorMsg(null);
  };

  const handleCreate = async () => {
    if (
      !customerId ||
      !warehouseId ||
      items.some((i) => !i.productId || !i.locationId || i.returnedQty <= 0)
    ) {
      setErrorMsg("Please select customer, warehouse, restock location, and valid return items.");
      return;
    }
    setErrorMsg(null);
    try {
      await createSalesReturnMutation.mutateAsync({
        customerId,
        warehouseId,
        notes: notes || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          locationId: i.locationId,
          originalQty: Number(i.originalQty),
          returnedQty: Number(i.returnedQty),
          reason: i.reason,
          refundAmount: Number(i.refundAmount || 0),
        })),
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create sales return");
    }
  };

  const handleConfirmPost = async () => {
    if (!confirmPostReturn) return;
    setErrorMsg(null);
    try {
      await postSalesReturnMutation.mutateAsync(confirmPostReturn.id);
      setConfirmPostReturn(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to post sales return");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "returnNumber", header: "Return #" },
    { key: "customerName", header: "Customer" },
    { key: "warehouse", header: "Warehouse" },
    { key: "returnDate", header: "Date" },
    { key: "returnedQty", header: "Returned Qty" },
    { key: "refundAmount", header: "Refund Amount" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const sr = salesReturnsData?.find((item) => item.id === r["id"]);
        if (!sr) return null;

        return (
          <div className="flex items-center gap-1">
            {sr.status === "DRAFT" && canReturn && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setConfirmPostReturn(sr)}
                >
                  <ArrowRightLeft className="mr-1 h-3 w-3" /> Post Return
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => cancelSalesReturnMutation.mutate(sr.id)}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = salesReturnsData
    ? salesReturnsData.map((sr) => {
        const totalQty = sr.items.reduce((s, i) => s + Number(i.returnedQty), 0);
        return {
          id: sr.id,
          returnNumber: sr.returnNumber,
          customerName: sr.customer?.name || "N/A",
          warehouse: sr.warehouse?.name || "N/A",
          returnDate: new Date(sr.returnDate).toLocaleDateString(),
          returnedQty: `${totalQty} units`,
          refundAmount: `₹${Number(sr.totalRefundAmount).toLocaleString("en-IN")}`,
          status: sr.status,
        };
      })
    : [];

  const stats = [
    { label: "Total Returns", value: isLoading ? "…" : String(salesReturnsData?.length || 0) },
    {
      label: "Pending Drafts",
      value: isLoading
        ? "…"
        : String(salesReturnsData?.filter((r) => r.status === "DRAFT").length || 0),
    },
    {
      label: "Posted (Restocked)",
      value: isLoading
        ? "…"
        : String(salesReturnsData?.filter((r) => r.status === "POSTED").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Sales Restock & Returns"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          canReturn ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> New Sales Return
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Sales Return Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sales Return</DialogTitle>
            <DialogDescription>
              Process customer item returns for restock and refund credit.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="srCust">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="srCust">
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
              <Label htmlFor="srWh">Receiving Warehouse *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger id="srWh">
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
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Returned Items</h4>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Return Line
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

                  <div className="col-span-2">
                    <Select
                      value={row.variantId || ""}
                      onValueChange={(val) => updateItemRow(idx, "variantId", val)}
                      disabled={!row.productId || !selectedProductVariants?.length}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Variant" />
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

                  <div className="col-span-3">
                    <Select
                      value={row.locationId}
                      onValueChange={(val) => updateItemRow(idx, "locationId", val)}
                      disabled={!warehouseId}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Bin Location *" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedWarehouseLocations?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} ({loc.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="Returned Qty"
                      value={row.returnedQty}
                      onChange={(e) => updateItemRow(idx, "returnedQty", Number(e.target.value))}
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
              disabled={createSalesReturnMutation.isPending || !customerId || !warehouseId}
            >
              {createSalesReturnMutation.isPending ? "Creating…" : "Save Draft Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Posting Sales Return */}
      {confirmPostReturn && (
        <Dialog open={Boolean(confirmPostReturn)} onOpenChange={() => setConfirmPostReturn(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5 text-warning" /> Confirm Return Posting
              </DialogTitle>
              <DialogDescription className="pt-2">
                Posting Sales Return <strong>{confirmPostReturn.returnNumber}</strong> will increase
                physical inventory levels and add cost layers in the receiving warehouse.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setConfirmPostReturn(null)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmPost}
                disabled={postSalesReturnMutation.isPending}
              >
                {postSalesReturnMutation.isPending
                  ? "Restocking Inventory…"
                  : "Confirm & Post Return"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

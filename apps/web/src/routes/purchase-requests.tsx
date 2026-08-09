import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  usePurchaseRequests,
  useCreatePurchaseRequest,
  useSubmitPurchaseRequest,
  useApprovePurchaseRequest,
  useRejectPurchaseRequest,
  useCancelPurchaseRequest,
  type PurchaseRequestItem,
} from "@/hooks/queries/usePurchaseRequests";
import { useProducts, type ProductItem } from "@/hooks/queries/useProducts";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useBranches } from "@/hooks/queries/useBranches";
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
import { Plus, Eye, Send, CheckCircle2, XCircle, Ban, Trash2 } from "lucide-react";

const title = "Purchase Requests";
const description = "Internal requisitions, stock requests, and approval workflow.";

export const Route = createFileRoute("/purchase-requests")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: PurchaseRequestsPage,
});

export interface PRFormLineItem {
  productId: string;
  variantId?: string | undefined;
  quantity: number;
  estimatedCost?: number | undefined;
}

function PurchaseRequestsPage() {
  const { data: requests } = usePurchaseRequests();
  const { data: productsData } = useProducts();
  const { data: warehouses } = useWarehouses();
  const { data: branches } = useBranches();

  const productsList = productsData?.data || [];

  const createPRMutation = useCreatePurchaseRequest();
  const submitPRMutation = useSubmitPurchaseRequest();
  const approvePRMutation = useApprovePurchaseRequest();
  const rejectPRMutation = useRejectPurchaseRequest();
  const cancelPRMutation = useCancelPurchaseRequest();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequestItem | null>(null);

  // PR Form State
  const [warehouseId, setWarehouseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<PRFormLineItem[]>([]);

  // Item form line state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    const newItem: PRFormLineItem = {
      productId: selectedProduct,
      ...(selectedVariant ? { variantId: selectedVariant } : {}),
      quantity: Number(quantity),
      ...(estimatedCost > 0 ? { estimatedCost: Number(estimatedCost) } : {}),
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedProduct("");
    setSelectedVariant("");
    setQuantity(1);
    setEstimatedCost(0);
  };

  const handleCreate = async () => {
    if (!warehouseId || items.length === 0) return;
    await createPRMutation.mutateAsync({
      warehouseId: warehouseId || undefined,
      branchId: branchId || undefined,
      requiredDate: requiredDate || undefined,
      reason: reason || undefined,
      items,
    });
    setIsAddOpen(false);
    setItems([]);
    setReason("");
  };

  const columns: Column<ListRow>[] = [
    { key: "requestNumber", header: "Request #" },
    { key: "requester", header: "Requester" },
    { key: "warehouse", header: "Target Warehouse" },
    { key: "itemCount", header: "Items" },
    { key: "estimatedTotal", header: "Est. Total" },
    { key: "requiredDate", header: "Required Date" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = requests?.find((p) => p.id === r["id"]);
        if (!item) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedPR(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {item.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={() => submitPRMutation.mutate({ id: item.id })}
                title="Submit Request"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            {item.status === "SUBMITTED" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-success"
                  onClick={() => approvePRMutation.mutate({ id: item.id })}
                  title="Approve Request"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => rejectPRMutation.mutate({ id: item.id })}
                  title="Reject Request"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            {(item.status === "DRAFT" || item.status === "SUBMITTED") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => cancelPRMutation.mutate({ id: item.id })}
                title="Cancel Request"
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = requests
    ? requests.map((pr) => {
        const totalEst = pr.items.reduce(
          (sum, i) => sum + Number(i.quantity) * Number(i.estimatedCost || 0),
          0,
        );
        return {
          id: pr.id,
          requestNumber: pr.requestNumber,
          requester: pr.requester ? `${pr.requester.firstName} ${pr.requester.lastName}` : "N/A",
          warehouse: pr.warehouse ? pr.warehouse.name : "N/A",
          itemCount: String(pr.items.length),
          estimatedTotal: `₹${totalEst.toLocaleString("en-IN")}`,
          requiredDate: pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString() : "N/A",
          status: pr.status,
        };
      })
    : [];

  const stats = [
    { label: "Total Requests", value: String(requests?.length || 0) },
    {
      label: "Pending Approval",
      value: String(requests?.filter((p) => p.status === "SUBMITTED").length || 0),
    },
    {
      label: "Approved",
      value: String(requests?.filter((p) => p.status === "APPROVED").length || 0),
    },
  ];

  const activeProduct = productsList.find((p: ProductItem) => p.id === selectedProduct);

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Purchasing"
        actionLabel="New request"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Request
            </Button>
          </div>
        }
      />

      {/* Create PR Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>New Purchase Request</DialogTitle>
            <DialogDescription>
              Create an internal requisition for materials or inventory replenishment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Warehouse *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Select Warehouse</option>
                {warehouses?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Required Date</Label>
              <Input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label>Reason / Justification</Label>
              <Input
                placeholder="e.g. Low stock alert replenishment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* Item Selector */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-sm">Requested Items</h4>

            <div className="grid gap-2 sm:grid-cols-5 items-end">
              <div className="sm:col-span-2">
                <Label className="text-xs">Product *</Label>
                <select
                  className="w-full h-9 px-2 rounded border text-xs"
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setSelectedVariant("");
                  }}
                >
                  <option value="">Select Product</option>
                  {productsList.map((p: ProductItem) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {activeProduct?.variants && activeProduct.variants.length > 0 && (
                <div>
                  <Label className="text-xs">Variant</Label>
                  <select
                    className="w-full h-9 px-2 rounded border text-xs"
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                  >
                    <option value="">Default</option>
                    {activeProduct.variants.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label className="text-xs">Qty *</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Button
                  size="sm"
                  className="w-full h-9"
                  onClick={handleAddItem}
                  disabled={!selectedProduct || quantity <= 0}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Added Items Table */}
            <div className="max-h-36 overflow-y-auto space-y-1">
              {items.map((it, idx) => {
                const p = productsList.find((prod: ProductItem) => prod.id === it.productId);
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center border rounded p-2 text-xs"
                  >
                    <div>
                      <span className="font-medium">{p?.name}</span> • Qty: {it.quantity}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createPRMutation.isPending || !warehouseId || items.length === 0}
            >
              Save Request (Draft)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

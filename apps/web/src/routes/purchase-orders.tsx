import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useSendPurchaseOrder,
  useCancelPurchaseOrder,
  type PurchaseOrderItem,
} from "@/hooks/queries/usePurchaseOrders";
import { useSuppliers } from "@/hooks/queries/useSuppliers";
import { usePurchaseRequests } from "@/hooks/queries/usePurchaseRequests";
import { useProducts, type ProductItem } from "@/hooks/queries/useProducts";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
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
import { Plus, Eye, Send, CheckCircle2, Trash2, Ban } from "lucide-react";

const title = "Purchase Orders";
const description = "Binding purchase orders to vendors, terms, line pricing, and status tracking.";

export const Route = createFileRoute("/purchase-orders")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: PurchaseOrdersPage,
});

export interface POFormLineItem {
  productId: string;
  variantId?: string | undefined;
  orderedQty: number;
  unitPrice: number;
  taxRate: number;
}

function PurchaseOrdersPage() {
  const { data: orders } = usePurchaseOrders();
  const { data: suppliers } = useSuppliers();
  const { data: purchaseRequests } = usePurchaseRequests();
  const { data: productsData } = useProducts();
  const { data: warehouses } = useWarehouses();

  const productsList = productsData?.data || [];

  const createPOMutation = useCreatePurchaseOrder();
  const submitPOMutation = useSubmitPurchaseOrder();
  const approvePOMutation = useApprovePurchaseOrder();
  const sendPOMutation = useSendPurchaseOrder();
  const cancelPOMutation = useCancelPurchaseOrder();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderItem | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [prId, setPRId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("NET30");
  const [currency, setCurrency] = useState("INR");
  const [items, setItems] = useState<POFormLineItem[]>([]);

  // Item Line State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(18);

  const handleAddItem = () => {
    if (!selectedProduct || qty <= 0 || unitPrice < 0) return;
    const newItem: POFormLineItem = {
      productId: selectedProduct,
      ...(selectedVariant ? { variantId: selectedVariant } : {}),
      orderedQty: Number(qty),
      unitPrice: Number(unitPrice),
      taxRate: Number(taxRate),
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedProduct("");
    setSelectedVariant("");
    setQty(1);
    setUnitPrice(0);
  };

  const handleCreate = async () => {
    if (!supplierId || !warehouseId || items.length === 0) return;
    await createPOMutation.mutateAsync({
      supplierId,
      purchaseRequestId: prId || undefined,
      warehouseId,
      currency,
      paymentTerms,
      items,
    });
    setIsAddOpen(false);
    setItems([]);
  };

  const columns: Column<ListRow>[] = [
    { key: "orderNumber", header: "PO #" },
    { key: "supplier", header: "Supplier" },
    { key: "warehouse", header: "Warehouse" },
    { key: "orderDate", header: "Order Date" },
    { key: "itemCount", header: "Items" },
    { key: "totalAmount", header: "Total Amount" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = orders?.find((po) => po.id === r["id"]);
        if (!item) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedPO(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {item.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={() => submitPOMutation.mutate({ id: item.id })}
                title="Submit PO"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            {item.status === "SUBMITTED" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-success"
                onClick={() => approvePOMutation.mutate({ id: item.id })}
                title="Approve PO"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            {item.status === "APPROVED" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={() => sendPOMutation.mutate({ id: item.id })}
                title="Send PO to Vendor"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            {["DRAFT", "SUBMITTED", "APPROVED", "SENT"].includes(item.status) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => cancelPOMutation.mutate({ id: item.id })}
                title="Cancel PO"
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = orders
    ? orders.map((po) => ({
        id: po.id,
        orderNumber: po.orderNumber,
        supplier: po.supplier ? po.supplier.name : "N/A",
        warehouse: po.warehouse ? po.warehouse.name : "N/A",
        orderDate: new Date(po.orderDate).toLocaleDateString(),
        itemCount: String(po.items.length),
        totalAmount: `₹${Number(po.totalAmount).toLocaleString("en-IN")}`,
        status: po.status,
      }))
    : [];

  const stats = [
    { label: "Total POs", value: String(orders?.length || 0) },
    {
      label: "Open / Sent POs",
      value: String(
        orders?.filter((o) => ["SENT", "PARTIALLY_RECEIVED"].includes(o.status)).length || 0,
      ),
    },
    {
      label: "Fully Received",
      value: String(orders?.filter((o) => o.status === "RECEIVED").length || 0),
    },
  ];

  const activeProduct = productsList.find((p: ProductItem) => p.id === selectedProduct);

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Purchasing"
        actionLabel="New purchase order"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Order
            </Button>
          </div>
        }
      />

      {/* Create PO Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Draft a binding order to a vendor with negotiated item prices and taxes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-3">
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
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

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
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Linked PR (Optional)</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={prId}
                onChange={(e) => setPRId(e.target.value)}
              >
                <option value="">None / Direct PO</option>
                {purchaseRequests
                  ?.filter((p) => p.status === "APPROVED")
                  .map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.requestNumber}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-sm">Line Items & Pricing</h4>

            <div className="grid gap-2 sm:grid-cols-6 items-end">
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

              <div>
                <Label className="text-xs">Qty *</Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Unit Price (₹) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Tax Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Button
                  size="sm"
                  className="w-full h-9"
                  onClick={handleAddItem}
                  disabled={!selectedProduct || qty <= 0}
                >
                  Add Line
                </Button>
              </div>
            </div>

            {/* Added Order Lines */}
            <div className="max-h-40 overflow-y-auto space-y-1">
              {items.map((it, idx) => {
                const p = productsList.find((prod: ProductItem) => prod.id === it.productId);
                const sub = it.orderedQty * it.unitPrice;
                const tax = (sub * it.taxRate) / 100;
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center border rounded p-2 text-xs"
                  >
                    <div>
                      <span className="font-medium">{p?.name}</span> • {it.orderedQty} x ₹
                      {it.unitPrice} (+{it.taxRate}% GST)
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">₹{(sub + tax).toLocaleString("en-IN")}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
              disabled={
                createPOMutation.isPending || !supplierId || !warehouseId || items.length === 0
              }
            >
              Save PO (Draft)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

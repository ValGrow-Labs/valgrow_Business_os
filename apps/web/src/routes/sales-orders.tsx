import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useSalesOrders,
  useCreateSalesOrder,
  useConfirmSalesOrder,
  useProcessSalesOrder,
  useCancelSalesOrder,
  type SalesOrderItem,
} from "@/hooks/queries/useSalesOrders";
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
import { Plus, Trash2, CheckCircle, PackageCheck, Play } from "lucide-react";

const title = "Sales Orders";
const description = "Confirmed sales orders, order fulfillment tracking, and shipment creation.";

export const Route = createFileRoute("/sales-orders")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SalesOrdersPage,
});

function SalesOrdersPage() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("sales.create");
  const canUpdate = permissions.includes("sales.update");
  const canApprove = permissions.includes("sales.approve");
  const canDeliver = permissions.includes("sales.deliver");

  const { data: salesOrdersData, isLoading } = useSalesOrders();
  const { data: customers } = useCustomers();
  const { data: warehouses } = useWarehouses();
  const { data: productsRes } = useProducts();
  const products = productsRes?.data;
  const { data: variants } = useProductVariants();

  const createSalesOrderMutation = useCreateSalesOrder();
  const confirmSalesOrderMutation = useConfirmSalesOrder();
  const processSalesOrderMutation = useProcessSalesOrder();
  const cancelSalesOrderMutation = useCancelSalesOrder();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("NET30");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<
    Array<{
      productId: string;
      variantId?: string;
      orderedQty: number;
      unitPrice: number;
      discountAmount?: number;
      taxRate?: number;
    }>
  >([
    { productId: "", variantId: "", orderedQty: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 },
  ]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: "", variantId: "", orderedQty: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 },
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
              updated.unitPrice = Number(prod.costPrice) * 1.5;
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
    setExpectedDeliveryDate("");
    setPaymentTerms("NET30");
    setNotes("");
    setItems([
      { productId: "", variantId: "", orderedQty: 1, unitPrice: 0, discountAmount: 0, taxRate: 18 },
    ]);
    setErrorMsg(null);
  };

  const handleCreate = async () => {
    if (!customerId || !warehouseId || items.some((i) => !i.productId || i.orderedQty <= 0)) {
      setErrorMsg("Please select a customer, warehouse, and valid product items.");
      return;
    }
    setErrorMsg(null);
    try {
      await createSalesOrderMutation.mutateAsync({
        customerId,
        warehouseId,
        expectedDeliveryDate: expectedDeliveryDate
          ? new Date(expectedDeliveryDate).toISOString()
          : undefined,
        paymentTerms,
        notes: notes || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          orderedQty: Number(i.orderedQty),
          unitPrice: Number(i.unitPrice),
          discountAmount: Number(i.discountAmount || 0),
          taxRate: Number(i.taxRate || 0),
        })),
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create sales order");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "orderNumber", header: "SO Number" },
    { key: "customerName", header: "Customer" },
    { key: "orderDate", header: "Order Date" },
    { key: "total", header: "Total Amount" },
    { key: "fulfillment", header: "Fulfillment" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const so = salesOrdersData?.find((item) => item.id === r["id"]);
        if (!so) return null;

        return (
          <div className="flex items-center gap-1">
            {so.status === "DRAFT" && canApprove && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-success border-success/30 hover:bg-success/10"
                  onClick={() => confirmSalesOrderMutation.mutate({ id: so.id })}
                >
                  <CheckCircle className="mr-1 h-3 w-3" /> Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => cancelSalesOrderMutation.mutate({ id: so.id })}
                >
                  Cancel
                </Button>
              </>
            )}

            {so.status === "CONFIRMED" && canUpdate && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => processSalesOrderMutation.mutate({ id: so.id })}
              >
                <Play className="mr-1 h-3 w-3" /> Process
              </Button>
            )}

            {(so.status === "PROCESSING" || so.status === "PARTIALLY_DELIVERED") && canDeliver && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  navigate({
                    to: "/delivery-notes",
                    search: { salesOrderId: so.id } as any,
                  })
                }
              >
                <PackageCheck className="mr-1 h-3 w-3" /> Create Delivery
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = salesOrdersData
    ? salesOrdersData.map((so) => {
        const totalOrdered = so.items.reduce((s, i) => s + Number(i.orderedQty), 0);
        const totalDelivered = so.items.reduce((s, i) => s + Number(i.deliveredQty || 0), 0);

        return {
          id: so.id,
          orderNumber: so.orderNumber,
          customerName: so.customer?.name || "N/A",
          orderDate: new Date(so.orderDate).toLocaleDateString(),
          total: `₹${Number(so.totalAmount).toLocaleString("en-IN")}`,
          fulfillment: `${totalDelivered} / ${totalOrdered} units`,
          status: so.status,
        };
      })
    : [];

  const stats = [
    { label: "Total Orders", value: isLoading ? "…" : String(salesOrdersData?.length || 0) },
    {
      label: "Processing",
      value: isLoading
        ? "…"
        : String(salesOrdersData?.filter((s) => s.status === "PROCESSING").length || 0),
    },
    {
      label: "Fully Delivered",
      value: isLoading
        ? "…"
        : String(salesOrdersData?.filter((s) => s.status === "DELIVERED").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Sales Fulfillment"
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
                <Plus className="mr-2 h-4 w-4" /> Direct Sales Order
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Sales Order Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sales Order</DialogTitle>
            <DialogDescription>
              Record a direct customer order for immediate processing and delivery.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="soCust">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="soCust">
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
              <Label htmlFor="soWh">Fulfillment Warehouse *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger id="soWh">
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
              <Label htmlFor="deliveryDate">Expected Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soTerms">Payment Terms</Label>
              <Input
                id="soTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Order Items</h4>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Product
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
                  <div className="col-span-4">
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
                      placeholder="Ordered Qty"
                      value={row.orderedQty}
                      onChange={(e) => updateItemRow(idx, "orderedQty", Number(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      placeholder="Unit Price (₹)"
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
              disabled={createSalesOrderMutation.isPending || !customerId || !warehouseId}
            >
              {createSalesOrderMutation.isPending ? "Creating…" : "Save Draft Sales Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

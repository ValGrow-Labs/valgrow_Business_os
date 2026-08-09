import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useDeliveryNotes,
  useCreateDeliveryNote,
  usePostDeliveryNote,
  useCancelDeliveryNote,
  type DeliveryNoteItem,
} from "@/hooks/queries/useDeliveryNotes";
import { useSalesOrders } from "@/hooks/queries/useSalesOrders";
import { useLocations } from "@/hooks/queries/useLocations";
import { useInventoryStock } from "@/hooks/queries/useInventoryStock";
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
import { Plus, PackageCheck, AlertTriangle } from "lucide-react";

const title = "Delivery Notes";
const description = "Shipment dispatch documents, stock deduction, and sales order fulfillment.";

export const Route = createFileRoute("/delivery-notes")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: DeliveryNotesPage,
});

function DeliveryNotesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canDeliver = permissions.includes("sales.deliver");

  const { data: deliveryNotesData, isLoading } = useDeliveryNotes();
  const { data: salesOrders } = useSalesOrders();
  const { data: locations } = useLocations();
  const { data: stockRes } = useInventoryStock();
  const stockLevels = stockRes?.data;

  const createDeliveryNoteMutation = useCreateDeliveryNote();
  const postDeliveryNoteMutation = usePostDeliveryNote();
  const cancelDeliveryNoteMutation = useCancelDeliveryNote();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [confirmPostNote, setConfirmPostNote] = useState<DeliveryNoteItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [salesOrderId, setSalesOrderId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const selectedSO = salesOrders?.find((so) => so.id === salesOrderId);
  const selectedWarehouseLocations = locations?.filter(
    (l) => l.warehouseId === selectedSO?.warehouseId,
  );

  const [items, setItems] = useState<
    Array<{
      salesOrderItemId: string;
      productId: string;
      variantId?: string;
      quantity: number;
    }>
  >([]);

  const handleSOSelect = (soId: string) => {
    setSalesOrderId(soId);
    const so = salesOrders?.find((s) => s.id === soId);
    if (so) {
      setItems(
        so.items.map((i) => {
          const remaining = Number(i.orderedQty) - Number(i.deliveredQty || 0);
          const itemVal: {
            salesOrderItemId: string;
            productId: string;
            variantId?: string;
            quantity: number;
          } = {
            salesOrderItemId: i.id!,
            productId: i.productId,
            quantity: Math.max(0, remaining),
          };
          if (i.variantId) {
            itemVal.variantId = i.variantId;
          }
          return itemVal;
        }),
      );
    }
  };

  const updateItemQuantity = (idx: number, qty: number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, quantity: qty } : item)));
  };

  const resetForm = () => {
    setSalesOrderId("");
    setLocationId("");
    setReferenceNumber("");
    setNotes("");
    setItems([]);
    setErrorMsg(null);
  };

  const handleCreate = async () => {
    if (!selectedSO || !locationId || items.some((i) => i.quantity <= 0)) {
      setErrorMsg(
        "Please select a valid Sales Order, dispatch location, and non-zero dispatch quantities.",
      );
      return;
    }
    setErrorMsg(null);
    try {
      await createDeliveryNoteMutation.mutateAsync({
        salesOrderId,
        customerId: selectedSO.customerId,
        warehouseId: selectedSO.warehouseId,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          salesOrderItemId: i.salesOrderItemId,
          productId: i.productId,
          variantId: i.variantId || undefined,
          locationId,
          quantity: Number(i.quantity),
        })),
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create delivery note");
    }
  };

  const handleConfirmPost = async () => {
    if (!confirmPostNote) return;
    setErrorMsg(null);
    try {
      await postDeliveryNoteMutation.mutateAsync(confirmPostNote.id);
      setConfirmPostNote(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to post delivery note");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "deliveryNumber", header: "Delivery #" },
    { key: "orderNumber", header: "Sales Order" },
    { key: "customerName", header: "Customer" },
    { key: "warehouse", header: "Warehouse" },
    { key: "deliveryDate", header: "Date" },
    { key: "totalQty", header: "Dispatched Qty" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const dn = deliveryNotesData?.find((item) => item.id === r["id"]);
        if (!dn) return null;

        return (
          <div className="flex items-center gap-1">
            {dn.status === "DRAFT" && canDeliver && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setConfirmPostNote(dn)}
                >
                  <PackageCheck className="mr-1 h-3 w-3" /> Post Delivery
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => cancelDeliveryNoteMutation.mutate(dn.id)}
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

  const rows: ListRow[] = deliveryNotesData
    ? deliveryNotesData.map((dn) => {
        const totalQty = dn.items.reduce((s, i) => s + Number(i.quantity), 0);
        return {
          id: dn.id,
          deliveryNumber: dn.deliveryNumber,
          orderNumber: dn.salesOrder?.orderNumber || "N/A",
          customerName: dn.customer?.name || "N/A",
          warehouse: dn.warehouse?.name || "N/A",
          deliveryDate: new Date(dn.deliveryDate).toLocaleDateString(),
          totalQty: `${totalQty} units`,
          status: dn.status,
        };
      })
    : [];

  const stats = [
    { label: "Total Deliveries", value: isLoading ? "…" : String(deliveryNotesData?.length || 0) },
    {
      label: "Pending Drafts",
      value: isLoading
        ? "…"
        : String(deliveryNotesData?.filter((d) => d.status === "DRAFT").length || 0),
    },
    {
      label: "Posted (Deducted)",
      value: isLoading
        ? "…"
        : String(deliveryNotesData?.filter((d) => d.status === "POSTED").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Outbound Logistics"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          canDeliver ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> New Delivery Note
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Delivery Note Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prepare Delivery Note</DialogTitle>
            <DialogDescription>
              Select an active Sales Order to dispatch items from stock.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dnSO">Sales Order *</Label>
              <Select value={salesOrderId} onValueChange={handleSOSelect}>
                <SelectTrigger id="dnSO">
                  <SelectValue placeholder="Select Sales Order" />
                </SelectTrigger>
                <SelectContent>
                  {salesOrders
                    ?.filter((so) => ["PROCESSING", "PARTIALLY_DELIVERED"].includes(so.status))
                    .map((so) => (
                      <SelectItem key={so.id} value={so.id}>
                        {so.orderNumber} — {so.customer?.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dnLoc">Dispatch Location Bin *</Label>
              <Select value={locationId} onValueChange={setLocationId} disabled={!selectedSO}>
                <SelectTrigger id="dnLoc">
                  <SelectValue placeholder="Select Location" />
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
          </div>

          {/* Item Quantities & Stock Availability Display */}
          {selectedSO && items.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="font-semibold text-sm">Shipment Line Items</h4>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const soItem = selectedSO.items.find((i) => i.id === item.salesOrderItemId);
                  const remaining =
                    Number(soItem?.orderedQty || 0) - Number(soItem?.deliveredQty || 0);

                  // Server-derived available stock at current location
                  const currentStock = stockLevels?.find(
                    (s) =>
                      s.locationId === locationId &&
                      s.productId === item.productId &&
                      s.variantId === (item.variantId || null),
                  );
                  const onHand = Number(currentStock?.onHand || 0);
                  const reserved = Number(currentStock?.reserved || 0);
                  const available = onHand - reserved;

                  return (
                    <div key={idx} className="border rounded p-3 text-sm space-y-2 bg-muted/10">
                      <div className="flex justify-between font-medium">
                        <span>
                          {soItem?.product?.name}{" "}
                          {soItem?.variant ? `(${soItem.variant.name})` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Ordered: {soItem?.orderedQty} | Delivered: {soItem?.deliveredQty || 0} |
                          Remaining: {remaining}
                        </span>
                      </div>

                      {locationId && (
                        <div className="flex items-center justify-between text-xs bg-muted/40 p-2 rounded">
                          <span className="text-muted-foreground">Server Stock Level:</span>
                          <span className="font-mono">
                            On Hand: {onHand} | Reserved: {reserved} |{" "}
                            <strong
                              className={
                                available < item.quantity ? "text-destructive" : "text-success"
                              }
                            >
                              Available: {available}
                            </strong>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-1">
                        <Label className="text-xs">Dispatch Quantity:</Label>
                        <Input
                          type="number"
                          className="h-8 w-32 text-xs"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(idx, Number(e.target.value))}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createDeliveryNoteMutation.isPending || !salesOrderId || !locationId}
            >
              {createDeliveryNoteMutation.isPending ? "Creating…" : "Save Draft Delivery Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Posting Delivery Note */}
      {confirmPostNote && (
        <Dialog open={Boolean(confirmPostNote)} onOpenChange={() => setConfirmPostNote(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5 text-warning" /> Confirm Delivery Posting
              </DialogTitle>
              <DialogDescription className="pt-2">
                Posting Delivery Note <strong>{confirmPostNote.deliveryNumber}</strong> will
                immediately deduct stock from physical inventory locations and update the Sales
                Order status.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setConfirmPostNote(null)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmPost}
                disabled={postDeliveryNoteMutation.isPending}
              >
                {postDeliveryNoteMutation.isPending
                  ? "Deducting Stock…"
                  : "Confirm & Post Delivery"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

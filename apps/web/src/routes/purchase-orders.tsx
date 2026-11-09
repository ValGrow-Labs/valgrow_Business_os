import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { exportToCsv, getExportFilename } from "@/lib/exportCsv";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
import { useDebounce } from "@/hooks/useDebounce";
import {
  usePurchaseOrders,
  usePurchaseOrder,
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
import { useTaxes } from "@/hooks/queries/useTaxes";
import { CreateProductDialog } from "@/components/products/create-product-dialog";
import { ProductPicker } from "@/components/products/product-picker";
import { toast } from "sonner";
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
import { downloadFile } from "@/lib/api-client";
import { Plus, Eye, Send, CheckCircle2, Trash2, Ban, Download, RotateCcw, FileText, Printer, Loader2 } from "lucide-react";

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
  const queryClient = useQueryClient();
  const { currencyCode, currencySymbol, formatMoney } = useActiveCurrency();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("ALL");

  const hasActiveFilters = Boolean(
    search.trim() || statusFilter !== "ALL" || supplierFilter !== "ALL",
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setSupplierFilter("ALL");
  };

  const {
    data: orders,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = usePurchaseOrders({
    search: debouncedSearch.trim() || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    supplierId: supplierFilter !== "ALL" ? supplierFilter : undefined,
  });
  const { data: suppliers } = useSuppliers();
  const { data: purchaseRequests } = usePurchaseRequests();
  const { data: productsData, refetch: refetchProducts } = useProducts({ limit: 100 });
  const { data: warehouses } = useWarehouses();
  const { data: taxes } = useTaxes();

  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [createdProducts, setCreatedProducts] = useState<ProductItem[]>([]);
  const [selectedProductObj, setSelectedProductObj] = useState<ProductItem | null>(null);
  const [productDetailsMap, setProductDetailsMap] = useState<Record<string, ProductItem>>({});

  // Merge created products with queried products so newly created items are instantly selectable
  const allProducts = [
    ...createdProducts.filter((cp) => !(productsData?.data || []).some((p) => p.id === cp.id)),
    ...(productsData?.data || []),
  ];
  const productsList = allProducts;
  const activeProducts = productsList.filter((p: ProductItem) => p.status === "ACTIVE" || !p.status);

  const handleSelectProduct = (product: ProductItem) => {
    setSelectedProduct(product.id);
    setSelectedProductObj(product);
    setSelectedVariant("");
    setProductDetailsMap((prev) => ({ ...prev, [product.id]: product }));

    const cost = Number(product.costPrice || 0);
    setUnitPrice(cost);
    if (product.tax?.rate !== undefined && product.tax.rate !== null) {
      setTaxRate(Number(product.tax.rate));
    } else if (product.taxId) {
      const matchedTax = taxes?.find((t) => t.id === product.taxId);
      if (matchedTax) {
        setTaxRate(Number(matchedTax.rate));
      }
    }
  };

  const handleProductCreated = (newProduct: ProductItem) => {
    setCreatedProducts((prev) => [newProduct, ...prev]);
    setProductDetailsMap((prev) => ({ ...prev, [newProduct.id]: newProduct }));
    handleSelectProduct(newProduct);
    queryClient.invalidateQueries({ queryKey: ["products"] });
    refetchProducts();
  };

  const createPOMutation = useCreatePurchaseOrder();
  const submitPOMutation = useSubmitPurchaseOrder();
  const approvePOMutation = useApprovePurchaseOrder();
  const sendPOMutation = useSendPurchaseOrder();
  const cancelPOMutation = useCancelPurchaseOrder();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: poDetail } = usePurchaseOrder(selectedPO?.id || "");
  const activePO = poDetail || selectedPO;

  const handleDownloadPdf = async (id: string, orderNumber: string) => {
    if (downloadingId) return;
    setDownloadingId(id);
    try {
      await downloadFile(`/purchase-orders/${id}/pdf`, `${orderNumber}.pdf`);
      toast.success(`Purchase Order ${orderNumber} downloaded successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to download Purchase Order PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [prId, setPRId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("NET30");
  const [currency, setCurrency] = useState(currencyCode || "INR");
  const [items, setItems] = useState<POFormLineItem[]>([]);

  useEffect(() => {
    if (currencyCode) {
      setCurrency(currencyCode);
    }
  }, [currencyCode]);

  // Item Line State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(18);

  const handleAddItem = () => {
    if (!selectedProduct || qty <= 0 || unitPrice < 0) return;

    // Check if product is already added as a line item
    const existingIndex = items.findIndex(
      (it) => it.productId === selectedProduct && (!selectedVariant || it.variantId === selectedVariant),
    );

    const existingItem = items[existingIndex];
    if (existingIndex >= 0 && existingItem) {
      const newQty = existingItem.orderedQty + Number(qty);
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex
            ? {
                ...it,
                orderedQty: newQty,
                unitPrice: unitPrice > 0 ? Number(unitPrice) : it.unitPrice,
                taxRate: Number(taxRate),
              }
            : it,
        ),
      );
      toast.success(
        `Updated quantity for ${selectedProductObj?.name || "product"} to ${newQty}`,
      );
    } else {
      const newItem: POFormLineItem = {
        productId: selectedProduct,
        ...(selectedVariant ? { variantId: selectedVariant } : {}),
        orderedQty: Number(qty),
        unitPrice: Number(unitPrice),
        taxRate: Number(taxRate),
      };
      setItems((prev) => [...prev, newItem]);
    }

    setSelectedProduct("");
    setSelectedProductObj(null);
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
              title="View PO Details"
              aria-label="View PO Details"
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              disabled={downloadingId === item.id}
              onClick={() => handleDownloadPdf(item.id, item.orderNumber)}
              title="Download PDF"
              aria-label="Download PDF"
            >
              {downloadingId === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  const [isExporting, setIsExporting] = useState(false);

  // Client-side smooth instantaneous filtering and relevance ranking on top of server query results
  const displayOrders = useMemo(() => {
    if (!orders) return [];
    const query = search.trim();
    if (!query) return orders;

    const qClean = query.toLowerCase().replace(/[-_\s]+/g, "");
    const qRaw = query.toLowerCase();

    const getRelevance = (po: PurchaseOrderItem) => {
      const orderRaw = (po.orderNumber || "").toLowerCase();
      const orderClean = orderRaw.replace(/[-_\s]+/g, "");
      const suppNameRaw = (po.supplier?.name || "").toLowerCase();
      const suppNameClean = suppNameRaw.replace(/[-_\s]+/g, "");
      const suppCodeRaw = (po.supplier?.code || "").toLowerCase();
      const suppCodeClean = suppCodeRaw.replace(/[-_\s]+/g, "");
      const whRaw = (po.warehouse?.name || "").toLowerCase();

      // 1. Exact match (PO number, supplier code or supplier name)
      if (
        orderClean === qClean ||
        orderRaw === qRaw ||
        suppCodeClean === qClean ||
        suppNameClean === qClean
      ) {
        return 100;
      }
      // 2. Starts with
      if (
        orderClean.startsWith(qClean) ||
        orderRaw.startsWith(qRaw) ||
        suppNameClean.startsWith(qClean) ||
        suppNameRaw.startsWith(qRaw)
      ) {
        return 80;
      }
      // 3. Word boundary starts with
      if (
        orderRaw.split(/[-_\s]+/).some((w) => w.startsWith(qRaw) || w.startsWith(qClean)) ||
        suppNameRaw.split(/[-_\s]+/).some((w) => w.startsWith(qRaw) || w.startsWith(qClean))
      ) {
        return 70;
      }
      // 4. Contains
      if (
        orderClean.includes(qClean) ||
        orderRaw.includes(qRaw) ||
        suppNameClean.includes(qClean) ||
        suppNameRaw.includes(qRaw) ||
        suppCodeClean.includes(qClean) ||
        whRaw.includes(qRaw)
      ) {
        return 60;
      }
      return 0;
    };

    const scored = orders
      .map((po) => ({ item: po, relevance: getRelevance(po) }))
      .filter((entry) => entry.relevance > 0);

    scored.sort((a, b) => b.relevance - a.relevance);
    return scored.map((entry) => entry.item);
  }, [orders, search]);

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const items = displayOrders || [];
      exportToCsv({
        filename: getExportFilename("valgrow-purchase-orders"),
        columns: [
          { header: "PO Number", accessor: (po) => po.orderNumber },
          { header: "Supplier Name", accessor: (po) => po.supplier?.name || "N/A" },
          { header: "Supplier Code", accessor: (po) => po.supplier?.code || "" },
          { header: "Order Date", accessor: (po) => po.orderDate ? new Date(po.orderDate).toLocaleDateString() : "" },
          { header: "Expected Delivery", accessor: (po) => po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "" },
          { header: "Warehouse", accessor: (po) => po.warehouse?.name || "N/A" },
          { header: "Warehouse Code", accessor: (po) => po.warehouse?.code || "" },
          { header: "Line Items", accessor: (po) => po.items?.length || 0 },
          { header: "Subtotal", accessor: (po) => po.subtotalAmount !== undefined ? Number(po.subtotalAmount).toFixed(2) : "" },
          { header: "Tax", accessor: (po) => po.taxAmount !== undefined ? Number(po.taxAmount).toFixed(2) : "" },
          { header: "Total Amount", accessor: (po) => po.totalAmount !== undefined ? Number(po.totalAmount).toFixed(2) : "0.00" },
          { header: "Currency", accessor: (po) => po.currency || currencyCode || "INR" },
          { header: "Payment Terms", accessor: (po) => po.paymentTerms || "" },
          { header: "Status", accessor: (po) => po.status },
        ],
        data: items,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const rows: ListRow[] = useMemo(() => {
    return displayOrders.map((po) => ({
      id: po.id,
      orderNumber: po.orderNumber,
      supplier: po.supplier ? po.supplier.name : "N/A",
      warehouse: po.warehouse ? po.warehouse.name : "N/A",
      orderDate: new Date(po.orderDate).toLocaleDateString(),
      itemCount: String(po.items.length),
      totalAmount: formatMoney(po.totalAmount, po.currency || currencyCode),
      status: po.status,
    }));
  }, [displayOrders, formatMoney, currencyCode]);

  const stats = useMemo(
    () => [
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
    ],
    [orders],
  );

  const filterContent = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1.5 min-w-[160px]">
        <Label className="text-xs text-muted-foreground font-normal">Status</Label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="SENT">Sent</option>
          <option value="PARTIALLY_RECEIVED">Partially Received</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[200px]">
        <Label className="text-xs text-muted-foreground font-normal">Supplier</Label>
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Suppliers</option>
          {suppliers?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className="flex items-end self-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Purchasing"
        actionLabel="New purchase order"
        onAction={() => setIsAddOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search POs by order number or supplier..."
        filterContent={filterContent}
        hasActiveFilters={hasActiveFilters}
        stats={stats}
        columns={columns}
        rows={rows}
        isLoading={isOrdersLoading && !orders}
        isError={isOrdersError}
        onRetry={() => refetchOrders()}
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
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Product *</Label>
                  <button
                    type="button"
                    onClick={() => setIsCreateProductOpen(true)}
                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    + Create New Product
                  </button>
                </div>
                <ProductPicker
                  id="po-product-picker"
                  selectedProductId={selectedProduct}
                  selectedProductDetails={selectedProductObj || productDetailsMap[selectedProduct]}
                  onSelectProduct={handleSelectProduct}
                  onClear={() => {
                    setSelectedProduct("");
                    setSelectedProductObj(null);
                    setUnitPrice(0);
                  }}
                  onCreateProductClick={() => setIsCreateProductOpen(true)}
                />
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
                <Label className="text-xs">Unit Price ({currencySymbol}) *</Label>
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
                const p =
                  productDetailsMap[it.productId] ||
                  productsList.find((prod: ProductItem) => prod.id === it.productId);
                const sub = it.orderedQty * it.unitPrice;
                const tax = (sub * it.taxRate) / 100;
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center border rounded p-2 text-xs"
                  >
                    <div>
                      <span className="font-medium">{p ? p.name : "Product"}</span>
                      {p?.sku && (
                        <span className="text-muted-foreground ml-1 font-mono">({p.sku})</span>
                      )}{" "}
                      • {it.orderedQty} x {formatMoney(it.unitPrice)} (+{it.taxRate}% GST)
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatMoney(sub + tax)}</span>
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

      {/* Create Product Dialog (modal-on-modal) */}
      <CreateProductDialog
        open={isCreateProductOpen}
        onOpenChange={setIsCreateProductOpen}
        onProductCreated={handleProductCreated}
      />

      {/* View PO Details Dialog */}
      <Dialog
        open={Boolean(selectedPO)}
        onOpenChange={(open) => {
          if (!open) setSelectedPO(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .print-po-container, .print-po-container * {
                visibility: visible !important;
              }
              .print-po-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 1.5rem !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <DialogHeader className="no-print">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold">
                  Purchase Order: {activePO?.orderNumber}
                </DialogTitle>
                {activePO?.status && <StatusBadge value={activePO.status} />}
              </div>
            </div>
            <DialogDescription>
              Comprehensive order details, supplier specifications, line pricing, and status.
            </DialogDescription>
          </DialogHeader>

          {activePO && (
            <div className="print-po-container space-y-6 py-2 text-sm">
              {/* SECTION 1: Header / Document Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b gap-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    PURCHASE ORDER
                  </h2>
                  <p className="text-sm font-semibold text-primary">{activePO.orderNumber}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <StatusBadge value={activePO.status} />
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Currency: {activePO.currency || currencyCode || "INR"}
                  </span>
                </div>
              </div>

              {/* SECTION 2 & 3: Supplier Details & Order Metadata Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SECTION 2: Supplier Details */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    Supplier Information
                  </h3>
                  <div className="font-semibold text-foreground text-base">
                    {activePO.supplier?.name || "N/A"}
                    {activePO.supplier?.code && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        ({activePO.supplier.code})
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block">Contact Person:</span>
                      <span className="font-medium text-foreground">
                        {activePO.supplier?.contactPerson || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Tax ID / GSTIN:</span>
                      <span className="font-medium text-foreground">
                        {activePO.supplier?.taxIdNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Email:</span>
                      <span className="font-medium text-foreground">
                        {activePO.supplier?.email || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Phone:</span>
                      <span className="font-medium text-foreground">
                        {activePO.supplier?.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                  {activePO.supplier?.address && (
                    <div className="text-xs pt-1 border-t border-border/50">
                      <span className="text-muted-foreground block">Address:</span>
                      <span className="text-foreground">
                        {[
                          activePO.supplier.address,
                          activePO.supplier.city,
                          activePO.supplier.state,
                          activePO.supplier.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* SECTION 3: Order Metadata */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Order & Delivery Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Order Date:</span>
                      <span className="font-medium text-foreground">
                        {activePO.orderDate
                          ? new Date(activePO.orderDate).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Expected Delivery:</span>
                      <span className="font-medium text-foreground">
                        {activePO.expectedDeliveryDate
                          ? new Date(activePO.expectedDeliveryDate).toLocaleDateString()
                          : "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Target Warehouse:</span>
                      <span className="font-medium text-foreground">
                        {activePO.warehouse?.name || "N/A"}
                        {activePO.warehouse?.code ? ` (${activePO.warehouse.code})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Branch:</span>
                      <span className="font-medium text-foreground">
                        {activePO.warehouse?.branch?.name || "Main / Default"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Payment Terms:</span>
                      <span className="font-medium text-foreground">
                        {activePO.paymentTerms || "NET30"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Purchase Request:</span>
                      <span className="font-medium text-foreground">
                        {activePO.purchaseRequest?.requestNumber || "None"}
                      </span>
                    </div>
                  </div>
                  {activePO.warehouse?.address && (
                    <div className="text-xs pt-1 border-t border-border/50">
                      <span className="text-muted-foreground block">Delivery Address:</span>
                      <span className="text-foreground">
                        {[activePO.warehouse.address, activePO.warehouse.city]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Order Line Items ({activePO.items?.length || 0})
                  </h3>
                </div>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground border-b font-medium">
                      <tr>
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">Item & Description</th>
                        <th className="p-2.5 text-right">Quantity</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Tax Rate</th>
                        <th className="p-2.5 text-right">Tax Amount</th>
                        <th className="p-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activePO.items && activePO.items.length > 0 ? (
                        activePO.items.map((it, idx) => {
                          const productName =
                            it.product?.name ||
                            productsList.find((p: ProductItem) => p.id === it.productId)?.name ||
                            "Product";
                          const sku = it.product?.sku;
                          const description = it.product?.description;
                          const unit = it.product?.unit?.code || "";
                          const qtyVal = Number(it.orderedQty || 0);
                          const priceVal = Number(it.unitPrice || 0);
                          const taxRateVal = Number(it.taxRate || 0);
                          const taxAmountVal =
                            it.taxAmount !== undefined
                              ? Number(it.taxAmount)
                              : (qtyVal * priceVal * taxRateVal) / 100;
                          const lineTotalVal =
                            it.totalAmount !== undefined
                              ? Number(it.totalAmount)
                              : qtyVal * priceVal + taxAmountVal;

                          return (
                            <tr key={it.id || idx} className="hover:bg-muted/20">
                              <td className="p-2.5 text-center text-muted-foreground">{idx + 1}</td>
                              <td className="p-2.5">
                                <div className="font-medium text-foreground">{productName}</div>
                                {sku && (
                                  <div className="text-[11px] text-muted-foreground font-mono">
                                    SKU: {sku}
                                  </div>
                                )}
                                {description && (
                                  <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                                    {description}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-right font-medium">
                                {qtyVal} {unit && <span className="text-[11px] text-muted-foreground font-normal ml-0.5">{unit}</span>}
                              </td>
                              <td className="p-2.5 text-right">
                                {formatMoney(priceVal, activePO.currency || currencyCode)}
                              </td>
                              <td className="p-2.5 text-right text-muted-foreground">
                                {taxRateVal}%
                              </td>
                              <td className="p-2.5 text-right text-muted-foreground">
                                {formatMoney(taxAmountVal, activePO.currency || currencyCode)}
                              </td>
                              <td className="p-2.5 text-right font-semibold text-foreground">
                                {formatMoney(lineTotalVal, activePO.currency || currencyCode)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-muted-foreground">
                            No line items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 5 & 6: Additional Information & Financial Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* SECTION 6: Notes & Timestamps */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-muted/20 text-xs">
                    <span className="font-semibold block text-foreground mb-1">
                      Notes & Terms
                    </span>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {activePO.notes || "No additional notes provided for this purchase order."}
                    </p>
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <div>
                      Created: {activePO.createdAt ? new Date(activePO.createdAt).toLocaleString() : "N/A"}
                    </div>
                    {activePO.updatedAt && (
                      <div>
                        Last Updated: {new Date(activePO.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 5: Financial Summary */}
                <div className="flex flex-col items-end">
                  <div className="w-full sm:w-72 p-3 rounded-lg border bg-muted/20 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium text-foreground">
                        {formatMoney(activePO.subtotalAmount || 0, activePO.currency || currencyCode)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Total:</span>
                      <span className="font-medium text-foreground">
                        {formatMoney(activePO.taxAmount || 0, activePO.currency || currencyCode)}
                      </span>
                    </div>
                    {Number(activePO.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount:</span>
                        <span>
                          -{formatMoney(activePO.discountAmount, activePO.currency || currencyCode)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm border-t border-border pt-2 text-foreground">
                      <span>Grand Total:</span>
                      <span className="text-primary font-bold">
                        {formatMoney(activePO.totalAmount || 0, activePO.currency || currencyCode)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="no-print flex items-center justify-between sm:justify-between w-full pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-1.5"
                title="Print Purchase Order"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              {activePO && (
                <Button
                  variant="default"
                  size="sm"
                  disabled={downloadingId === activePO.id}
                  onClick={() => handleDownloadPdf(activePO.id, activePO.orderNumber)}
                  className="flex items-center gap-1.5"
                  title="Download PDF"
                >
                  {downloadingId === activePO.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span>Download PDF</span>
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedPO(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

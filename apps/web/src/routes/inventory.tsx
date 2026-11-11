import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, NameCell, NumberCell, type ListRow } from "@/components/foundation/list-page";
import { ModuleTabs } from "@/components/foundation/module-tabs";
import type { Column } from "@/components/foundation/data-table";
import { useInventoryStock, type StockItem } from "@/hooks/queries/useInventoryStock";
import { useProducts, type ProductItem } from "@/hooks/queries/useProducts";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useLocations } from "@/hooks/queries/useLocations";
import { useCreateAdjustment } from "@/hooks/queries/useInventoryAdjustments";
import { useCreateWarehouse } from "@/hooks/queries/useWarehouses";
import { useCreateLocation } from "@/hooks/queries/useLocations";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Boxes, SlidersHorizontal, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv, getExportFilename } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";

const title = "Live Stock Levels";
const description =
  "Real-time stock availability, reservations, and location placement across all warehouses.";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: InventoryStockPage,
});

function InventoryStockPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [filterWarehouseId, setFilterWarehouseId] = useState<string>("ALL");
  const [filterLocationId, setFilterLocationId] = useState<string>("ALL");
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Fetch locations for filter warehouse if specific warehouse selected
  const { data: filterLocations = [] } = useLocations(
    filterWarehouseId !== "ALL" ? filterWarehouseId : undefined,
  );

  const hasActiveFilters = Boolean(
    filterWarehouseId !== "ALL" ||
    filterLocationId !== "ALL" ||
    lowStockOnly
  );

  const handleClearFilters = () => {
    setFilterWarehouseId("ALL");
    setFilterLocationId("ALL");
    setLowStockOnly(false);
    setSearch("");
    setPage(1);
  };

  const {
    data: stockData,
    isLoading: isStockLoading,
    isError: isStockError,
    refetch: refetchStock,
  } = useInventoryStock({
    page,
    search: debouncedSearch.trim() || undefined,
    warehouseId: filterWarehouseId !== "ALL" ? filterWarehouseId : undefined,
    locationId: filterLocationId !== "ALL" ? filterLocationId : undefined,
    lowStock: lowStockOnly || undefined,
  });
  const { data: productsData } = useProducts({
    limit: 100,
    search: debouncedSearch.trim() || undefined,
  });
  const { data: warehouses = [] } = useWarehouses();

  const createAdjustmentMutation = useCreateAdjustment();
  const createWarehouseMutation = useCreateWarehouse();

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [quantityStr, setQuantityStr] = useState<string>("");
  const [reason, setReason] = useState<string>("COUNT_CORRECTION");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch locations for selected warehouse
  const { data: locations = [] } = useLocations(selectedWarehouseId);
  const createLocationMutation = useCreateLocation(selectedWarehouseId);

  const handleOpenAdjust = async (targetProductId?: string) => {
    setFormError(null);
    setQuantityStr("");
    setNotes("");
    setAdjustmentType("INCREASE");
    setReason("COUNT_CORRECTION");
    setSelectedLocationId("");

    // Select Product
    const defaultProduct = targetProductId || productsData?.data?.[0]?.id || "";
    setSelectedProductId(defaultProduct);

    // Auto-ensure default warehouse if none exist
    let activeWarehouseId = selectedWarehouseId;
    if (warehouses.length > 0) {
      activeWarehouseId = warehouses[0]!.id;
      setSelectedWarehouseId(activeWarehouseId);
    } else {
      try {
        const newWh = await createWarehouseMutation.mutateAsync({
          name: "Main Warehouse",
          code: "WH-MAIN",
          isDefault: true,
        });
        activeWarehouseId = newWh.id;
        setSelectedWarehouseId(activeWarehouseId);

        const newLoc = await createLocationMutation.mutateAsync({
          name: "Default Bin",
          code: "LOC-MAIN",
          isDefault: true,
        });
        setSelectedLocationId(newLoc.id);
      } catch (err) {
        console.warn("Auto warehouse creation fallback handled");
      }
    }

    setIsDialogOpen(true);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProductId) {
      setFormError("Please select a product.");
      return;
    }

    if (!selectedWarehouseId) {
      setFormError("Please select a warehouse.");
      return;
    }

    // Validate that selected bin belongs to the selected warehouse if provided
    if (selectedLocationId) {
      const binBelongsToWarehouse = locations.some((l) => l.id === selectedLocationId);
      if (!binBelongsToWarehouse) {
        setFormError("Selected location does not belong to the chosen warehouse.");
        return;
      }
    }

    const qtyNum = Number(quantityStr);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setFormError("Please enter a valid positive quantity.");
      return;
    }

    // Find current stock level for this product & location/warehouse
    const existingStock = stockData?.data?.find((s) => {
      if (s.productId !== selectedProductId) return false;
      if (selectedLocationId) {
        return s.warehouseId === selectedWarehouseId && s.locationId === selectedLocationId;
      }
      return s.warehouseId === selectedWarehouseId;
    });

    const currentQty = existingStock ? Number(existingStock.onHand) : 0;
    const adjustedQty = adjustmentType === "INCREASE" ? qtyNum : -qtyNum;
    const newQty = Math.max(0, currentQty + adjustedQty);

    const selectedProduct = productsData?.data?.find((p) => p.id === selectedProductId);
    const unitCost = selectedProduct ? Number(selectedProduct.costPrice || 0) : 0;

    const payload = {
      adjustmentNumber: `ADJ-${Date.now().toString().slice(-6)}`,
      warehouseId: selectedWarehouseId,
      reason: reason as any,
      notes: notes.trim() || null,
      items: [
        {
          ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
          productId: selectedProductId,
          currentQty,
          adjustedQty,
          newQty,
          unitCost,
        },
      ],
    };

    try {
      await createAdjustmentMutation.mutateAsync(payload as any);
      toast.success(
        `Stock ${adjustmentType === "INCREASE" ? "increased" : "decreased"} by ${qtyNum} units!`,
      );
      setIsDialogOpen(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to post stock adjustment.");
      toast.error(err?.message || "Failed to post stock adjustment.");
    }
  };

  // Stock and Catalog mappings available across component
  const catalogProducts = useMemo(() => productsData?.data || [], [productsData?.data]);
  const stockByProductMap = useMemo(() => {
    const map = new Map<string, StockItem[]>();
    if (stockData?.data) {
      for (const item of stockData.data) {
        const existing = map.get(item.productId) || [];
        existing.push(item);
        map.set(item.productId, existing);
      }
    }
    return map;
  }, [stockData?.data]);

  // Build Table Rows: Combine Catalog Products with Stock Levels & Relevance Sorting
  const rows: ListRow[] = useMemo(() => {
    const query = search.trim();

    // Helper to compute relevance for ranking matches at the top
    const getRelevance = (prodName: string, sku: string | null = "") => {
      if (!query) return 1;
      const qClean = query.toLowerCase().replace(/[-_\s]+/g, "");
      const nameClean = prodName.toLowerCase().replace(/[-_\s]+/g, "");
      const skuClean = (sku || "").toLowerCase().replace(/[-_\s]+/g, "");
      const qRaw = query.toLowerCase();
      const nameRaw = prodName.toLowerCase();
      const skuRaw = (sku || "").toLowerCase();

      // 1. Exact match (e.g. "tshirt" matches "t-shirt" or "T-Shirt")
      if (nameClean === qClean || nameRaw === qRaw || (skuClean && skuClean === qClean)) return 100;

      // 2. Starts with match
      if (nameClean.startsWith(qClean) || nameRaw.startsWith(qRaw)) return 80;

      // 3. Word boundary starts with
      if (nameRaw.split(/[-_\s]+/).some((w) => w.startsWith(qRaw) || w.startsWith(qClean))) return 70;

      // 4. Contains match
      if (nameClean.includes(qClean) || (skuClean && skuClean.includes(qClean))) return 60;
      if (nameRaw.includes(qRaw) || (skuRaw && skuRaw.includes(qRaw))) return 50;

      // 5. Query tokens match
      const tokens = qRaw.split(/[-_\s]+/).filter(Boolean);
      if (tokens.length > 0 && tokens.every((t) => nameClean.includes(t) || skuClean.includes(t))) return 40;

      return 0;
    };

    const scoredRows: { row: ListRow; relevance: number }[] = [];

    if (catalogProducts.length > 0) {
      for (const prod of catalogProducts) {
        const stockLevels = stockByProductMap.get(prod.id) || [];
        const relevance = getRelevance(prod.name, prod.sku);

        // If searching and this product has no relevance match, skip it
        if (query && relevance === 0) continue;

        if (stockLevels.length > 0) {
          for (const s of stockLevels) {
            scoredRows.push({
              row: {
                id: s.id,
                productId: prod.id,
                product: s.product?.name || prod.name,
                variant: s.variant?.name || "Base Product",
                facility: `${s.warehouse?.name || "N/A"} → ${s.location?.name || "N/A"}`,
                batch: s.batch?.batchNumber || "Non-Batched",
                reserved: `${s.reserved} Units`,
                available: `${s.available} Units`,
              },
              relevance,
            });
          }
        } else {
          // Product has no stock levels yet
          scoredRows.push({
            row: {
              id: `no-stock-${prod.id}`,
              productId: prod.id,
              product: prod.name,
              variant: "Base Product",
              facility: warehouses[0]?.name ? `${warehouses[0].name} (Unstocked)` : "No Location Assigned",
              batch: "Non-Batched",
              reserved: "0 Units",
              available: "0 Units",
            },
            relevance,
          });
        }
      }
    } else if (stockData?.data) {
      for (const s of stockData.data) {
        const pName = s.product?.name || "Unassigned Product";
        const pSku = s.variant?.sku || s.product?.sku || "";
        const relevance = getRelevance(pName, pSku);

        if (query && relevance === 0) continue;

        scoredRows.push({
          row: {
            id: s.id,
            productId: s.productId,
            product: pName,
            variant: s.variant?.name || "Base Product",
            facility: `${s.warehouse?.name || "N/A"} → ${s.location?.name || "N/A"}`,
            batch: s.batch?.batchNumber || "Non-Batched",
            reserved: `${s.reserved} Units`,
            available: `${s.available} Units`,
          },
          relevance,
        });
      }
    }

    // Sort matching rows by relevance score descending so exact matches appear at the VERY TOP!
    if (query) {
      scoredRows.sort((a, b) => b.relevance - a.relevance);
    }

    return scoredRows.map((item) => item.row);
  }, [stockData, catalogProducts, stockByProductMap, warehouses, search]);

  // Calculate Header Stats (memoized so cards don't jitter during typing)
  const totalOnHand = useMemo(
    () => stockData?.data?.reduce((acc, curr) => acc + Number(curr.onHand), 0) || 0,
    [stockData?.data],
  );
  const totalReserved = useMemo(
    () => stockData?.data?.reduce((acc, curr) => acc + Number(curr.reserved), 0) || 0,
    [stockData?.data],
  );
  const totalAvailable = useMemo(
    () => stockData?.data?.reduce((acc, curr) => acc + Number(curr.available), 0) || 0,
    [stockData?.data],
  );

  const stats = useMemo(
    () => [
      { label: "Total On Hand", value: `${totalOnHand} Units`, hint: "Physical stock across warehouses" },
      { label: "Total Reserved", value: `${totalReserved} Units`, hint: "Locked in active orders" },
      { label: "Total Available", value: `${totalAvailable} Units`, hint: "Available for allocation" },
    ],
    [totalOnHand, totalReserved, totalAvailable],
  );

  const columns: Column<ListRow>[] = [
    {
      key: "product",
      header: "Product",
      className: "min-w-[200px]",
      render: (r) => <NameCell value={String(r["product"] ?? "")} sub={String(r["variant"] ?? "")} />,
    },
    {
      key: "facility",
      header: "Warehouse & Location",
      className: "min-w-[180px]",
      render: (r) => <span className="text-muted-foreground">{String(r["facility"] ?? "")}</span>,
    },
    {
      key: "batch",
      header: "Batch No.",
      className: "w-32",
      render: (r) => <span className="font-mono text-xs text-muted-foreground">{String(r["batch"] ?? "")}</span>,
    },
    {
      key: "reserved",
      header: "Reserved",
      className: "text-right w-28",
      render: (r) => <NumberCell value={String(r["reserved"] ?? "")} />,
    },
    {
      key: "available",
      header: "Available",
      className: "text-right w-32",
      render: (r) => {
        const value = String(r["available"] ?? "");
        const qty = Number(value.replace(/[^\d.-]/g, ""));
        return (
          <NumberCell
            value={value}
            {...(Number.isFinite(qty) && qty <= 0 ? { tone: "danger" as const } : {})}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right w-28",
      render: (r) => (
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold"
            onClick={() => handleOpenAdjust(r["productId"])}
            title="Adjust Stock for Product"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Adjust
          </Button>
        </div>
      ),
    },
  ];

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      interface InventoryExportItem {
        productName: string;
        sku: string;
        barcode: string;
        category: string;
        warehouse: string;
        onHand: number;
        reserved: number;
        available: number;
        reorderPoint: number | string;
        stockStatus: string;
      }

      const exportItems: InventoryExportItem[] = [];

      if (catalogProducts.length > 0) {
        for (const prod of catalogProducts) {
          const stockLevels = stockByProductMap.get(prod.id) || [];
          if (stockLevels.length > 0) {
            for (const s of stockLevels) {
              const onHand = Number(s.onHand || 0);
              const reserved = Number(s.reserved || 0);
              const available = Number(s.available || 0);
              const reorderPoint =
                s.reorderLevel !== null && s.reorderLevel !== undefined ? Number(s.reorderLevel) : "";
              const stockStatus =
                available <= 0
                  ? "Out of Stock"
                  : s.reorderLevel !== null && s.reorderLevel !== undefined && available <= Number(s.reorderLevel)
                  ? "Low Stock"
                  : "In Stock";

              exportItems.push({
                productName: s.product?.name || prod.name,
                sku: s.variant?.sku || s.product?.sku || prod.sku || "",
                barcode: prod.barcode || "",
                category: prod.category?.name || "Unassigned",
                warehouse: s.warehouse ? `${s.warehouse.name}${s.location?.name ? ` (${s.location.name})` : ""}` : "Unassigned",
                onHand,
                reserved,
                available,
                reorderPoint,
                stockStatus,
              });
            }
          } else {
            exportItems.push({
              productName: prod.name,
              sku: prod.sku || "",
              barcode: prod.barcode || "",
              category: prod.category?.name || "Unassigned",
              warehouse: warehouses[0]?.name ? `${warehouses[0].name} (Unstocked)` : "Unassigned",
              onHand: 0,
              reserved: 0,
              available: 0,
              reorderPoint: "",
              stockStatus: "Out of Stock",
            });
          }
        }
      } else if (stockData?.data && stockData.data.length > 0) {
        for (const s of stockData.data) {
          const onHand = Number(s.onHand || 0);
          const reserved = Number(s.reserved || 0);
          const available = Number(s.available || 0);
          const reorderPoint =
            s.reorderLevel !== null && s.reorderLevel !== undefined ? Number(s.reorderLevel) : "";
          const stockStatus =
            available <= 0
              ? "Out of Stock"
              : s.reorderLevel !== null && s.reorderLevel !== undefined && available <= Number(s.reorderLevel)
              ? "Low Stock"
              : "In Stock";

          exportItems.push({
            productName: s.product?.name || "Unassigned Product",
            sku: s.variant?.sku || s.product?.sku || "",
            barcode: "",
            category: "Unassigned",
            warehouse: s.warehouse ? `${s.warehouse.name}${s.location?.name ? ` (${s.location.name})` : ""}` : "Unassigned",
            onHand,
            reserved,
            available,
            reorderPoint,
            stockStatus,
          });
        }
      }

      exportToCsv({
        filename: getExportFilename("valgrow-inventory"),
        columns: [
          { header: "Product Name", accessor: (i) => i.productName },
          { header: "SKU", accessor: (i) => i.sku },
          { header: "Barcode", accessor: (i) => i.barcode },
          { header: "Category", accessor: (i) => i.category },
          { header: "Warehouse", accessor: (i) => i.warehouse },
          { header: "On Hand", accessor: (i) => i.onHand },
          { header: "Reserved", accessor: (i) => i.reserved },
          { header: "Available", accessor: (i) => i.available },
          { header: "Reorder Point", accessor: (i) => i.reorderPoint },
          { header: "Stock Status", accessor: (i) => i.stockStatus },
        ],
        data: exportItems,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isSubmitting = createAdjustmentMutation.isPending;

  const filterContent = (
    <div className="flex flex-wrap items-center gap-2.5 w-full">
      {/* Warehouse Filter */}
      <div className="w-44">
        <Select
          value={filterWarehouseId}
          onValueChange={(val) => {
            setFilterWarehouseId(val);
            setFilterLocationId("ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Warehouses</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter (Active only when warehouse is selected or if locations available) */}
      <div className="w-40">
        <Select
          value={filterLocationId}
          onValueChange={(val) => {
            setFilterLocationId(val);
            setPage(1);
          }}
          disabled={filterWarehouseId === "ALL" || filterLocations.length === 0}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={filterWarehouseId === "ALL" ? "Select warehouse first" : "All Locations"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Locations</SelectItem>
            {filterLocations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Low Stock Toggle Button */}
      <Button
        type="button"
        variant={lowStockOnly ? "secondary" : "outline"}
        size="sm"
        onClick={() => {
          setLowStockOnly((prev) => !prev);
          setPage(1);
        }}
        className="h-8 text-xs gap-1.5"
      >
        <AlertTriangle className={cn("h-3.5 w-3.5", lowStockOnly ? "text-amber-500" : "text-muted-foreground")} />
        Low Stock Only
      </Button>

      {/* Reset Action */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      <ListPage guide="inventory"
        title={title}
        description={description}
        eyebrow="Inventory"
        actionLabel="Adjust stock"
        onAction={() => handleOpenAdjust()}
        onExport={handleExport}
        isExporting={isExporting}
        stats={stats}
        columns={columns}
        rows={rows}
        isLoading={isStockLoading && !stockData}
        isError={isStockError}
        onRetry={() => refetchStock()}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search inventory by product, SKU, warehouse, or location…"
        filterContent={filterContent}
        hasActiveFilters={hasActiveFilters}
      >
        <ModuleTabs
          id="catalog"
          tabs={[
            { to: "/products", label: "Product catalog", icon: Package },
            { to: "/inventory", label: "Live stock levels", icon: Boxes },
          ]}
        />
      </ListPage>

      {/* Adjust Stock Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory Stock</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitAdjustment} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 text-xs rounded border border-destructive/40 bg-destructive/10 text-destructive font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              {/* Select Product */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-product">
                  Product <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => setSelectedProductId(val)}
                >
                  <SelectTrigger id="adj-product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Warehouse */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-warehouse">
                  Warehouse <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedWarehouseId}
                  onValueChange={(val) => {
                    setSelectedWarehouseId(val);
                    setSelectedLocationId("");
                  }}
                >
                  <SelectTrigger id="adj-warehouse">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location / Bin (Optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-location">Location / Bin (Optional)</Label>
                <Select
                  value={selectedLocationId || "none"}
                  onValueChange={(val) => setSelectedLocationId(val === "none" ? "" : val)}
                  disabled={!selectedWarehouseId}
                >
                  <SelectTrigger id="adj-location">
                    <SelectValue placeholder="Select location / bin (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Warehouse default</SelectItem>
                    {locations
                      .filter((l) => l.status === "ACTIVE" || !l.status)
                      .map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name} {loc.code ? `(${loc.code})` : ""} {loc.isDefault ? "• Default" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Action Type: Increase or Decrease */}
                <div className="space-y-1.5">
                  <Label htmlFor="adj-type">Adjustment Action</Label>
                  <Select
                    value={adjustmentType}
                    onValueChange={(val: "INCREASE" | "DECREASE") => setAdjustmentType(val)}
                  >
                    <SelectTrigger id="adj-type">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCREASE">Increase (+)</SelectItem>
                      <SelectItem value="DECREASE">Decrease (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label htmlFor="adj-qty">
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="adj-qty"
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="e.g. 50"
                    value={quantityStr}
                    onChange={(e) => setQuantityStr(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-reason">Reason</Label>
                <Select value={reason} onValueChange={(val) => setReason(val)}>
                  <SelectTrigger id="adj-reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COUNT_CORRECTION">Count Correction</SelectItem>
                    <SelectItem value="OPENING_BALANCE">Opening Balance</SelectItem>
                    <SelectItem value="FOUND">Stock Found</SelectItem>
                    <SelectItem value="DAMAGED">Damaged Goods</SelectItem>
                    <SelectItem value="LOST">Lost / Missing</SelectItem>
                    <SelectItem value="EXPIRED">Expired Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="adj-notes">Notes / Reference</Label>
                <Textarea
                  id="adj-notes"
                  placeholder="Optional stock adjustment reason or reference number…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

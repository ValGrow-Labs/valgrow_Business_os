import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { EmptyState } from "@/components/foundation/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  Columns,
  Download,
  Building2,
  SlidersHorizontal,
  Layers,
  FileText,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Calculator,
} from "lucide-react";
import {
  useInventoryAdjustments,
  useCreateAdjustment,
  type AdjustmentItem,
  type CreateAdjustmentLineInput,
} from "@/hooks/queries/useInventoryAdjustments";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useLocations } from "@/hooks/queries/useLocations";
import { useProducts } from "@/hooks/queries/useProducts";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";

const title = "Stock Adjustments";
const description = "Physical stock count corrections, damage write-offs, and lot reconciliations.";

export const Route = createFileRoute("/adjustments")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: AdjustmentsPage,
});

const REASON_OPTIONS = [
  { value: "COUNT_CORRECTION", label: "Count Correction" },
  { value: "DAMAGED", label: "Damaged Stock" },
  { value: "LOST", label: "Lost / Stolen" },
  { value: "FOUND", label: "Found Stock" },
  { value: "EXPIRED", label: "Expired Product" },
  { value: "OPENING_BALANCE", label: "Opening Balance" },
  { value: "MANUFACTURING_CONSUMPTION", label: "Mfg Consumption" },
  { value: "MANUFACTURING_RECEIPT", label: "Mfg Receipt" },
];

interface VisibleCols {
  adjustmentNumber: boolean;
  warehouse: boolean;
  reason: boolean;
  linesCount: boolean;
  costImpact: boolean;
  date: boolean;
  actions: boolean;
}

function AdjustmentsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];
  const canAdjust = permissions.length === 0 || permissions.includes("inventory.adjust");

  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  // Query options
  const queryOpts = {
    search: search ? search : undefined,
    reason: reasonFilter !== "ALL" ? reasonFilter : undefined,
    warehouseId: warehouseFilter !== "ALL" ? warehouseFilter : undefined,
  };

  const { data: adjustmentsData, isLoading } = useInventoryAdjustments(queryOpts);

  const { data: warehousesData } = useWarehouses();
  const { data: locationsData } = useLocations();
  const { data: productsRes } = useProducts({ limit: 100 });

  const warehouses = warehousesData || [];
  const locations = locationsData || [];
  const products = productsRes?.data || [];

  const createMutation = useCreateAdjustment();

  // Selected Detail Modal
  const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentItem | null>(null);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [reason, setReason] = useState("COUNT_CORRECTION");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Line item input state
  const [lines, setLines] = useState<CreateAdjustmentLineInput[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [currentQty, setCurrentQty] = useState("0");
  const [newQty, setNewQty] = useState("0");
  const [unitCost, setUnitCost] = useState("0");

  // Visible columns
  const [visibleCols, setVisibleCols] = useState<VisibleCols>({
    adjustmentNumber: true,
    warehouse: true,
    reason: true,
    linesCount: true,
    costImpact: true,
    date: true,
    actions: true,
  });

  const adjustments = adjustmentsData || [];

  // Compute stat cards
  const totalAdjustments = adjustments.length;
  let totalNetDelta = 0;
  let totalCostImpact = 0;
  let countCorrections = 0;
  let writeOffs = 0;

  adjustments.forEach((adj) => {
    if (adj.reason === "COUNT_CORRECTION") countCorrections++;
    if (["DAMAGED", "LOST", "EXPIRED"].includes(adj.reason)) writeOffs++;

    adj.items?.forEach((item) => {
      const delta = Number(item.adjustedQty || 0);
      const cost = Number(item.unitCost || 0);
      totalNetDelta += delta;
      totalCostImpact += delta * cost;
    });
  });

  // Handle line addition in create form
  const handleAddLine = () => {
    if (!selectedProductId) {
      setErrorMsg("Please select a product for the line item.");
      return;
    }
    if (!selectedLocationId) {
      setErrorMsg("Please select a location for the line item.");
      return;
    }

    const curr = parseFloat(currentQty) || 0;
    const n = parseFloat(newQty) || 0;
    const delta = n - curr;
    const cost = parseFloat(unitCost) || 0;

    const newLine: CreateAdjustmentLineInput = {
      productId: selectedProductId,
      locationId: selectedLocationId,
      currentQty: curr,
      newQty: n,
      adjustedQty: delta,
      unitCost: cost,
    };

    setLines((prev) => [...prev, newLine]);
    setSelectedProductId("");
    setSelectedLocationId("");
    setCurrentQty("0");
    setNewQty("0");
    setUnitCost("0");
    setErrorMsg(null);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (pId: string) => {
    setSelectedProductId(pId);
    const p = products.find((prod) => prod.id === pId);
    if (p && p.costPrice) {
      setUnitCost(String(p.costPrice));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!warehouseId) {
      setErrorMsg("Please select a warehouse.");
      return;
    }
    if (lines.length === 0) {
      setErrorMsg("Please add at least one line item to the adjustment.");
      return;
    }

    const generatedNumber = `ADJ-${Date.now().toString().slice(-6)}`;

    createMutation.mutate(
      {
        adjustmentNumber: generatedNumber,
        warehouseId,
        reason,
        notes: notes ? notes : undefined,
        items: lines,
      },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setWarehouseId("");
          setReason("COUNT_CORRECTION");
          setNotes("");
          setLines([]);
          setErrorMsg(null);
        },
        onError: (err: any) => {
          setErrorMsg(err.message || "Failed to post stock adjustment.");
        },
      }
    );
  };

  const handleExportCSV = () => {
    if (adjustments.length === 0) return;
    const headers = ["Adjustment No.", "Warehouse", "Reason", "Lines", "Created Date"];
    const rows = adjustments.map((a) => [
      a.adjustmentNumber,
      a.warehouse?.name || a.warehouseId,
      a.reason,
      String(a.items?.length || 0),
      new Date(a.createdAt).toLocaleString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_adjustments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLocations = warehouseId
    ? locations.filter((loc) => loc.warehouseId === warehouseId)
    : locations;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          eyebrow="Inventory"
          title={title}
          description={description}
          actions={
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs py-1">
                <Calculator className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">FIFO Valuation Engine</span>
                <span className="sm:hidden">FIFO</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={adjustments.length === 0} className="text-xs sm:text-sm">
                <Download className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Export CSV</span>
              </Button>
              {canAdjust && (
                <Button size="sm" onClick={() => setIsFormOpen(true)} className="text-xs sm:text-sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>New Adjustment</span>
                </Button>
              )}
            </div>
          }
        />

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Adjustments"
            value={String(totalAdjustments)}
            icon={SlidersHorizontal}
            hint="Posted audit records"
          />
          <StatCard
            label="Net Qty Delta"
            value={`${totalNetDelta >= 0 ? "+" : ""}${totalNetDelta.toFixed(2)}`}
            icon={totalNetDelta >= 0 ? TrendingUp : TrendingDown}
            hint="Overall stock quantity change"
          />
          <StatCard
            label="Net Cost Impact"
            value={`₹${totalCostImpact.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={Calculator}
            hint="Valuation balance impact"
          />
          <StatCard
            label="Corrections vs Write-Offs"
            value={`${countCorrections} / ${writeOffs}`}
            icon={Layers}
            hint="Count corrections / damage loss"
          />
        </div>

        {/* Filters bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 max-w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search adjustment no, warehouse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-full"
              />
            </div>

            {/* Reason Filter */}
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Reason Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Reasons</SelectItem>
                {REASON_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Warehouse Filter */}
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Warehouse" />
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

          {/* Columns dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleCols.adjustmentNumber}
                onCheckedChange={(c) => setVisibleCols((p) => ({ ...p, adjustmentNumber: !!c }))}
              >
                Adjustment No.
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleCols.warehouse}
                onCheckedChange={(c) => setVisibleCols((p) => ({ ...p, warehouse: !!c }))}
              >
                Warehouse
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleCols.reason}
                onCheckedChange={(c) => setVisibleCols((p) => ({ ...p, reason: !!c }))}
              >
                Reason
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleCols.linesCount}
                onCheckedChange={(c) => setVisibleCols((p) => ({ ...p, linesCount: !!c }))}
              >
                Lines Count
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleCols.costImpact}
                onCheckedChange={(c) => setVisibleCols((p) => ({ ...p, costImpact: !!c }))}
              >
                Cost Impact
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleCols.date}
                onCheckedChange={(c) => setVisibleCols((p) => ({ ...p, date: !!c }))}
              >
                Date & Time
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading stock adjustments...</div>
        ) : adjustments.length === 0 ? (
          <EmptyState
            title="No stock adjustments found"
            description="Create a new stock adjustment to reconcile count errors or process damage write-offs."
            action={
              canAdjust ? (
                <Button size="sm" onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Stock Adjustment
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleCols.adjustmentNumber && <TableHead>Adjustment No.</TableHead>}
                  {visibleCols.warehouse && <TableHead>Warehouse</TableHead>}
                  {visibleCols.reason && <TableHead>Reason Code</TableHead>}
                  {visibleCols.linesCount && <TableHead>Adjusted Lines</TableHead>}
                  {visibleCols.costImpact && <TableHead className="text-right">Net Cost Impact</TableHead>}
                  {visibleCols.date && <TableHead>Date & Time</TableHead>}
                  {visibleCols.actions && <TableHead className="text-right">Details</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((a) => {
                  let netImpact = 0;
                  a.items?.forEach((item) => {
                    netImpact += Number(item.adjustedQty || 0) * Number(item.unitCost || 0);
                  });

                  return (
                    <TableRow key={a.id}>
                      {visibleCols.adjustmentNumber && (
                        <TableCell className="font-mono font-medium">{a.adjustmentNumber}</TableCell>
                      )}
                      {visibleCols.warehouse && (
                        <TableCell>{a.warehouse?.name || a.warehouseId}</TableCell>
                      )}
                      {visibleCols.reason && (
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {a.reason.replace(/_/g, " ").toLowerCase()}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleCols.linesCount && (
                        <TableCell>{a.items?.length || 0} Line Items</TableCell>
                      )}
                      {visibleCols.costImpact && (
                        <TableCell className={`text-right font-mono font-medium ${netImpact < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {netImpact >= 0 ? "+" : ""}₹{netImpact.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      )}
                      {visibleCols.date && (
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString()}
                        </TableCell>
                      )}
                      {visibleCols.actions && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAdjustment(a)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* View Details Dialog */}
        <Dialog open={!!selectedAdjustment} onOpenChange={(open) => !open && setSelectedAdjustment(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Adjustment Details: {selectedAdjustment?.adjustmentNumber}
              </DialogTitle>
              <DialogDescription>
                Posted under valuation engine with reason code: {selectedAdjustment?.reason}
              </DialogDescription>
            </DialogHeader>

            {selectedAdjustment && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4 rounded-md border p-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Warehouse: </span>
                    <span className="font-medium">{selectedAdjustment.warehouse?.name || selectedAdjustment.warehouseId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reason Code: </span>
                    <span className="font-medium">{selectedAdjustment.reason}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Posted Date: </span>
                    <span className="font-medium">{new Date(selectedAdjustment.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notes: </span>
                    <span className="font-medium">{selectedAdjustment.notes || "None"}</span>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Adjustment Line Items</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Current</TableHead>
                          <TableHead className="text-right">Delta</TableHead>
                          <TableHead className="text-right">New Qty</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAdjustment.items?.map((item) => {
                          const delta = Number(item.adjustedQty);
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.product?.name || item.productId}
                                {item.product?.sku && <div className="text-xs text-muted-foreground">SKU: {item.product.sku}</div>}
                              </TableCell>
                              <TableCell>{item.location?.code || item.locationId}</TableCell>
                              <TableCell className="text-right">{Number(item.currentQty).toFixed(2)}</TableCell>
                              <TableCell className={`text-right font-medium ${delta < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">{Number(item.newQty).toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono">₹{Number(item.unitCost).toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAdjustment(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Adjustment Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post New Stock Adjustment</DialogTitle>
              <DialogDescription>
                Record stock adjustments with reason codes. Cost impact is auto-calculated using the tenant valuation engine (FIFO/LIFO/Weighted Avg).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse *</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger id="warehouse">
                      <SelectValue placeholder="Select Warehouse" />
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

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason Code *</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Reason Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {REASON_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Reference</Label>
                <Textarea
                  id="notes"
                  placeholder="Reason details, physical count batch reference, audit notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Add Line Section */}
              <div className="rounded-md border p-3 space-y-3 bg-muted/20">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-primary" /> Add Adjustment Line
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Product *</Label>
                    <Select value={selectedProductId} onValueChange={handleProductSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Location *</Label>
                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLocations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.code} - {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Current Qty</Label>
                    <Input
                      type="number"
                      value={currentQty}
                      onChange={(e) => setCurrentQty(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">New Qty</Label>
                    <Input
                      type="number"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Cost (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="secondary" className="w-full" onClick={handleAddLine}>
                      Add Line
                    </Button>
                  </div>
                </div>
              </div>

              {/* Added Lines Table */}
              {lines.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">New</TableHead>
                        <TableHead className="text-right">Delta</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Remove</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((l, idx) => {
                        const prod = products.find((p) => p.id === l.productId);
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{prod?.name || l.productId}</TableCell>
                            <TableCell className="text-right">{l.currentQty}</TableCell>
                            <TableCell className="text-right">{l.newQty}</TableCell>
                            <TableCell className={`text-right font-semibold ${l.adjustedQty < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              {l.adjustedQty >= 0 ? "+" : ""}{l.adjustedQty}
                            </TableCell>
                            <TableCell className="text-right font-mono">₹{l.unitCost}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveLine(idx)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || lines.length === 0}>
                  {createMutation.isPending ? "Posting..." : "Post Adjustment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

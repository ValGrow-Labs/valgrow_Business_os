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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  Columns,
  MoreHorizontal,
  Edit2,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Factory,
} from "lucide-react";
import {
  useInventoryBatches,
  useCreateBatch,
  useUpdateBatch,
  type BatchItem,
} from "@/hooks/queries/useInventoryBatches";
import { useProducts } from "@/hooks/queries/useProducts";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";

const title = "Inventory Batches & Lots";
const description =
  "Lot numbers, manufacturing dates, expiration tracking, and manufacturing lot sub-types.";

export const Route = createFileRoute("/batches")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: BatchesPage,
});

function getBatchExpiryStatus(expiryDate: string | null) {
  if (!expiryDate) {
    return { status: "ACTIVE", label: "No Expiry", style: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" };
  }

  const exp = new Date(expiryDate);
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "EXPIRED",
      label: `Expired (${Math.abs(diffDays)}d ago)`,
      style: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    };
  } else if (diffDays <= 30) {
    return {
      status: "EXPIRING_SOON",
      label: `Expiring in ${diffDays}d`,
      style: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    };
  } else {
    return {
      status: "ACTIVE",
      label: `Active (${diffDays}d left)`,
      style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    };
  }
}

interface VisibleCols {
  batchNumber: boolean;
  product: boolean;
  subtype: boolean;
  quantity: boolean;
  warehouses: boolean;
  mfgDate: boolean;
  expDate: boolean;
  cost: boolean;
  actions: boolean;
}

function BatchesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.length === 0 || permissions.includes("inventory.create");
  const canUpdate = permissions.length === 0 || permissions.includes("inventory.update");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Query hooks
  const queryParams: any = {};
  if (search) queryParams.search = search;
  if (statusFilter !== "ALL") queryParams.status = statusFilter;
  if (typeFilter !== "ALL") queryParams.batchType = typeFilter;

  const { data: batchesData, isLoading } = useInventoryBatches(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );

  const { data: productsRes } = useProducts({ limit: 100 });
  const products = productsRes?.data || [];

  const createMutation = useCreateBatch();
  const updateMutation = useUpdateBatch();

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [formProductId, setFormProductId] = useState("");
  const [formBatchNumber, setFormBatchNumber] = useState("");
  const [formBatchType, setFormBatchType] = useState<"STANDARD" | "MANUFACTURING_LOT">("STANDARD");
  const [formWorkOrderRef, setFormWorkOrderRef] = useState("");
  const [formMfgDate, setFormMfgDate] = useState("");
  const [formExpDate, setFormExpDate] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("0");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState<VisibleCols>({
    batchNumber: true,
    product: true,
    subtype: true,
    quantity: true,
    warehouses: true,
    mfgDate: true,
    expDate: true,
    cost: true,
    actions: true,
  });

  // Calculate overall stats regardless of filter
  const allBatches = batchesData || [];
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const activeCount = allBatches.filter((b) => {
    if (!b.expiryDate) return true;
    const exp = new Date(b.expiryDate);
    return exp > soon;
  }).length;

  const expiringSoonCount = allBatches.filter((b) => {
    if (!b.expiryDate) return false;
    const exp = new Date(b.expiryDate);
    return exp >= now && exp <= soon;
  }).length;

  const expiredCount = allBatches.filter((b) => {
    if (!b.expiryDate) return false;
    return new Date(b.expiryDate) < now;
  }).length;

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setFormProductId(products[0]?.id || "");
    setFormBatchNumber(`LOT-${Date.now().toString().slice(-6)}`);
    setFormBatchType("STANDARD");
    setFormWorkOrderRef("");
    setFormMfgDate(new Date().toISOString().split("T")[0] || "");
    setFormExpDate("");
    setFormCostPrice("0");
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (batch: BatchItem) => {
    setEditingBatch(batch);
    setFormProductId(batch.productId);
    setFormBatchNumber(batch.batchNumber);
    setFormBatchType(batch.batchType === "MANUFACTURING_LOT" ? "MANUFACTURING_LOT" : "STANDARD");
    setFormWorkOrderRef(batch.workOrderRef || "");
    setFormMfgDate(batch.manufactureDate ? batch.manufactureDate.split("T")[0] || "" : "");
    setFormExpDate(batch.expiryDate ? batch.expiryDate.split("T")[0] || "" : "");
    setFormCostPrice(String(batch.costPrice || "0"));
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formProductId) {
      setErrorMsg("Please select a product");
      return;
    }
    if (!formBatchNumber.trim()) {
      setErrorMsg("Batch number is required");
      return;
    }

    try {
      if (editingBatch) {
        await updateMutation.mutateAsync({
          id: editingBatch.id,
          data: {
            productId: formProductId,
            batchNumber: formBatchNumber.trim(),
            batchType: formBatchType,
            workOrderRef: formBatchType === "MANUFACTURING_LOT" ? formWorkOrderRef.trim() || null : null,
            manufactureDate: formMfgDate ? new Date(formMfgDate).toISOString() : null,
            expiryDate: formExpDate ? new Date(formExpDate).toISOString() : null,
            costPrice: formCostPrice,
          },
        });
      } else {
        await createMutation.mutateAsync({
          productId: formProductId,
          batchNumber: formBatchNumber.trim(),
          batchType: formBatchType,
          workOrderRef: formBatchType === "MANUFACTURING_LOT" ? formWorkOrderRef.trim() || null : null,
          manufactureDate: formMfgDate ? new Date(formMfgDate).toISOString() : null,
          expiryDate: formExpDate ? new Date(formExpDate).toISOString() : null,
          costPrice: formCostPrice,
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save batch lot");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Batch Number",
      "Subtype",
      "Work Order Ref",
      "Product Name",
      "SKU",
      "Mfg Date",
      "Expiry Date",
      "Cost Price",
      "Quantity Remaining",
      "Warehouses",
    ];
    const csvRows = [headers.join(",")];

    allBatches.forEach((b) => {
      const warehousesStr = (b.warehouses || []).map((w) => w.code || w.name).join("; ");
      const row = [
        `"${b.batchNumber}"`,
        `"${b.batchType || "STANDARD"}"`,
        `"${b.workOrderRef || ""}"`,
        `"${b.product?.name || ""}"`,
        `"${b.product?.sku || ""}"`,
        `"${b.manufactureDate ? b.manufactureDate.split("T")[0] : ""}"`,
        `"${b.expiryDate ? b.expiryDate.split("T")[0] : ""}"`,
        `"${b.costPrice}"`,
        `"${b.quantityRemaining || 0}"`,
        `"${warehousesStr}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `inventory-batches-${new Date().toISOString().split("T")[0]}.csv`);
    a.click();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          eyebrow="Inventory"
          title={title}
          description={description}
          actions={
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs sm:text-sm">
                <Download className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Export CSV</span>
              </Button>
              {canCreate && (
                <Button size="sm" onClick={handleOpenCreate} className="text-xs sm:text-sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>New Batch Lot</span>
                </Button>
              )}
            </div>
          }
        />

        {/* Aggregate Stat Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Batches"
            value={allBatches.length.toLocaleString()}
            hint="Registered lot numbers"
            icon={Layers}
          />
          <StatCard
            label="Active Batches"
            value={activeCount.toLocaleString()}
            hint="Stock available & valid"
            icon={CheckCircle2}
          />
          <StatCard
            label="Expiring in 30 Days"
            value={expiringSoonCount.toLocaleString()}
            hint="Requires immediate rotation"
            icon={AlertTriangle}
          />
          <StatCard
            label="Expired Lots"
            value={expiredCount.toLocaleString()}
            hint="Stock passed expiration"
            icon={XCircle}
          />
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by lot #, product, work order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
            {/* Filter Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {(statusFilter !== "ALL" || typeFilter !== "ALL") && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.2 text-[10px]">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="end">
                <div className="font-medium text-sm border-b pb-2">Filter Batches</div>
                <div className="space-y-2">
                  <Label className="text-xs">Expiry Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active (Valid)</SelectItem>
                      <SelectItem value="EXPIRING_SOON">Expiring Soon (≤30 days)</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Batch Subtype</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Subtypes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Subtypes</SelectItem>
                      <SelectItem value="STANDARD">Standard Batch</SelectItem>
                      <SelectItem value="MANUFACTURING_LOT">Manufacturing Lot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setTypeFilter("ALL");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Columns Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Columns className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={visibleCols.batchNumber}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, batchNumber: Boolean(v) }))}
                >
                  Batch / Lot Number
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.product}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, product: Boolean(v) }))}
                >
                  Product & SKU
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.subtype}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, subtype: Boolean(v) }))}
                >
                  Subtype / Ref
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.quantity}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, quantity: Boolean(v) }))}
                >
                  Quantity Remaining
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.warehouses}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, warehouses: Boolean(v) }))}
                >
                  Warehouses
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.mfgDate}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, mfgDate: Boolean(v) }))}
                >
                  Manufacture Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.expDate}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, expDate: Boolean(v) }))}
                >
                  Expiry Date & Health
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.cost}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, cost: Boolean(v) }))}
                >
                  Cost Price
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleCols.batchNumber && <TableHead>Batch / Lot #</TableHead>}
                {visibleCols.product && <TableHead>Product</TableHead>}
                {visibleCols.subtype && <TableHead>Subtype</TableHead>}
                {visibleCols.quantity && <TableHead className="text-right">Qty Remaining</TableHead>}
                {visibleCols.warehouses && <TableHead>Warehouses</TableHead>}
                {visibleCols.mfgDate && <TableHead>Mfg Date</TableHead>}
                {visibleCols.expDate && <TableHead>Expiry Status</TableHead>}
                {visibleCols.cost && <TableHead className="text-right">Cost Price</TableHead>}
                {visibleCols.actions && <TableHead className="w-12 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    Loading inventory batches...
                  </TableCell>
                </TableRow>
              ) : allBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState
                      title="No inventory batches found"
                      description="Create a lot number or manufacturing batch to track expiration and cost layers."
                      action={
                        canCreate ? (
                          <Button size="sm" onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" /> New Batch Lot
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                allBatches.map((batch) => {
                  const expiryInfo = getBatchExpiryStatus(batch.expiryDate);
                  const isMfg = batch.batchType === "MANUFACTURING_LOT";

                  return (
                    <TableRow key={batch.id}>
                      {visibleCols.batchNumber && (
                        <TableCell className="font-mono font-medium text-sm">
                          {batch.batchNumber}
                        </TableCell>
                      )}
                      {visibleCols.product && (
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{batch.product?.name || "Unknown Product"}</span>
                            {batch.product?.sku && (
                              <span className="text-xs font-mono text-muted-foreground">
                                SKU: {batch.product.sku}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.subtype && (
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            {isMfg ? (
                              <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 gap-1 text-[10px]">
                                <Factory className="h-3 w-3" /> Mfg Lot
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Standard
                              </Badge>
                            )}
                            {batch.workOrderRef && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                WO: {batch.workOrderRef}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.quantity && (
                        <TableCell className="text-right font-medium text-sm">
                          {(batch.quantityRemaining || 0).toLocaleString()}
                        </TableCell>
                      )}
                      {visibleCols.warehouses && (
                        <TableCell>
                          {batch.warehouses && batch.warehouses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {batch.warehouses.map((w) => (
                                <Badge key={w.id} variant="secondary" className="text-[10px]">
                                  {w.code || w.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.mfgDate && (
                        <TableCell className="text-xs text-muted-foreground">
                          {batch.manufactureDate
                            ? new Date(batch.manufactureDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </TableCell>
                      )}
                      {visibleCols.expDate && (
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge className={`text-[11px] ${expiryInfo.style}`}>
                              {expiryInfo.label}
                            </Badge>
                            {batch.expiryDate && (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(batch.expiryDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.cost && (
                        <TableCell className="text-right font-mono text-sm">
                          ₹{Number(batch.costPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                      )}
                      {visibleCols.actions && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => handleOpenEdit(batch)}>
                                  <Edit2 className="mr-2 h-4 w-4" /> Edit Batch
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create / Edit Batch Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBatch ? "Edit Batch / Lot" : "Create Batch / Lot"}
              </DialogTitle>
              <DialogDescription>
                Assign lot details, manufacturing subtype, expiration dates, and cost prices.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveForm} className="space-y-4 py-2">
              {errorMsg && (
                <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select value={formProductId} onValueChange={setFormProductId}>
                  <SelectTrigger id="productId">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch / Lot Number *</Label>
                  <Input
                    id="batchNumber"
                    value={formBatchNumber}
                    onChange={(e) => setFormBatchNumber(e.target.value)}
                    placeholder="e.g. LOT-2026-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchType">Batch Subtype</Label>
                  <Select
                    value={formBatchType}
                    onValueChange={(v) => setFormBatchType(v as "STANDARD" | "MANUFACTURING_LOT")}
                  >
                    <SelectTrigger id="batchType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard Batch</SelectItem>
                      <SelectItem value="MANUFACTURING_LOT">Manufacturing Lot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formBatchType === "MANUFACTURING_LOT" && (
                <div className="space-y-2">
                  <Label htmlFor="workOrderRef">Work Order / Manufacturing Ref</Label>
                  <Input
                    id="workOrderRef"
                    value={formWorkOrderRef}
                    onChange={(e) => setFormWorkOrderRef(e.target.value)}
                    placeholder="e.g. WO-99201"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mfgDate">Manufacture Date</Label>
                  <Input
                    id="mfgDate"
                    type="date"
                    value={formMfgDate}
                    onChange={(e) => setFormMfgDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expDate">Expiry Date</Label>
                  <Input
                    id="expDate"
                    type="date"
                    value={formExpDate}
                    onChange={(e) => setFormExpDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Unit Cost Price (₹)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingBatch ? "Save Changes" : "Create Batch"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

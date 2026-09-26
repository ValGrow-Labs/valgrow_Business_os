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
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Building2,
  ArrowRight,
  Package,
} from "lucide-react";
import {
  useInventoryTransfers,
  useCreateTransfer,
  useUpdateTransfer,
  type TransferItem,
} from "@/hooks/queries/useInventoryTransfers";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useLocations } from "@/hooks/queries/useLocations";
import { useProducts } from "@/hooks/queries/useProducts";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";

const title = "Stock Transfers";
const description =
  "Inter-warehouse and inter-location inventory shipments, transfer tracking, and double-entry postings.";

export const Route = createFileRoute("/transfers")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: TransfersPage,
});

interface VisibleCols {
  transferNumber: boolean;
  source: boolean;
  destination: boolean;
  itemsCount: boolean;
  status: boolean;
  timestamps: boolean;
  actions: boolean;
}

function getTransferStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return {
        label: "Draft",
        style: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      };
    case "IN_TRANSIT":
      return {
        label: "In Transit",
        style: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        style: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      };
    default:
      return {
        label: status,
        style: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      };
  }
}

function TransfersPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];
  const canTransfer = permissions.length === 0 || permissions.includes("inventory.transfer");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Query hooks
  const { data: transfersData, isLoading } = useInventoryTransfers(
    statusFilter !== "ALL" ? statusFilter : undefined
  );
  const { data: warehousesData } = useWarehouses();
  const { data: locationsData } = useLocations();
  const { data: productsRes } = useProducts({ limit: 100 });

  const warehouses = warehousesData || [];
  const locations = locationsData || [];
  const products = productsRes?.data || [];

  const createMutation = useCreateTransfer();
  const updateMutation = useUpdateTransfer();

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sourceWhId, setSourceWhId] = useState("");
  const [destWhId, setDestWhId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Line item modal state
  const [productId, setProductId] = useState("");
  const [sourceLocId, setSourceLocId] = useState("");
  const [destLocId, setDestLocId] = useState("");
  const [requestedQty, setRequestedQty] = useState("1");

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState<VisibleCols>({
    transferNumber: true,
    source: true,
    destination: true,
    itemsCount: true,
    status: true,
    timestamps: true,
    actions: true,
  });

  const allTransfers = transfersData || [];

  // Filter transfers locally by search
  const filteredTransfers = allTransfers.filter((t) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      t.transferNumber.toLowerCase().includes(term) ||
      (t.sourceWarehouse?.name || "").toLowerCase().includes(term) ||
      (t.destWarehouse?.name || "").toLowerCase().includes(term) ||
      (t.notes || "").toLowerCase().includes(term)
    );
  });

  const draftCount = allTransfers.filter((t) => t.status === "DRAFT").length;
  const inTransitCount = allTransfers.filter((t) => t.status === "IN_TRANSIT").length;
  const completedCount = allTransfers.filter((t) => t.status === "COMPLETED").length;

  const handleOpenCreate = () => {
    const defaultSource = warehouses[0]?.id || "";
    const defaultDest = warehouses[1]?.id || warehouses[0]?.id || "";
    setSourceWhId(defaultSource);
    setDestWhId(defaultDest);
    setFormNotes("");
    setProductId(products[0]?.id || "");
    setRequestedQty("1");
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  // Filter locations by warehouse
  const sourceLocations = locations.filter((l) => l.warehouseId === sourceWhId);
  const destLocations = locations.filter((l) => l.warehouseId === destWhId);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!sourceWhId || !destWhId) {
      setErrorMsg("Please select source and destination warehouses");
      return;
    }
    if (sourceWhId === destWhId) {
      setErrorMsg("Source and destination warehouses must be different");
      return;
    }
    if (!productId) {
      setErrorMsg("Please select a product");
      return;
    }
    if (!sourceLocId) {
      setErrorMsg("Please select a source location");
      return;
    }
    if (!destLocId) {
      setErrorMsg("Please select a destination location");
      return;
    }
    if (Number(requestedQty) <= 0) {
      setErrorMsg("Quantity must be greater than 0");
      return;
    }

    try {
      await createMutation.mutateAsync({
        transferNumber: `TRF-${Date.now().toString().slice(-6)}`,
        sourceWarehouseId: sourceWhId,
        destWarehouseId: destWhId,
        notes: formNotes.trim() || null,
        items: [
          {
            id: "",
            transferId: "",
            productId,
            variantId: null,
            batchId: null,
            sourceLocationId: sourceLocId,
            destLocationId: destLocId,
            requestedQty: Number(requestedQty),
            shippedQty: 0,
            receivedQty: 0,
          },
        ],
      });
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create transfer");
    }
  };

  const handleStatusTransition = async (id: string, newStatus: "IN_TRANSIT" | "COMPLETED" | "CANCELLED") => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status: newStatus },
      });
    } catch (err: any) {
      alert(err.message || `Failed to transition transfer to ${newStatus}`);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Transfer Number",
      "Source Warehouse",
      "Destination Warehouse",
      "Status",
      "Items Count",
      "Created Date",
      "Shipped Date",
      "Received Date",
      "Notes",
    ];
    const csvRows = [headers.join(",")];

    filteredTransfers.forEach((t) => {
      const row = [
        `"${t.transferNumber}"`,
        `"${t.sourceWarehouse?.name || ""}"`,
        `"${t.destWarehouse?.name || ""}"`,
        `"${t.status}"`,
        `"${t.items?.length || 0}"`,
        `"${t.createdAt ? t.createdAt.split("T")[0] : ""}"`,
        `"${t.shippedAt ? t.shippedAt.split("T")[0] : ""}"`,
        `"${t.receivedAt ? t.receivedAt.split("T")[0] : ""}"`,
        `"${t.notes || ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `stock-transfers-${new Date().toISOString().split("T")[0]}.csv`);
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
              {canTransfer && (
                <Button size="sm" onClick={handleOpenCreate} className="text-xs sm:text-sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>New Transfer</span>
                </Button>
              )}
            </div>
          }
        />

        {/* Aggregate Stat Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Transfers"
            value={allTransfers.length.toLocaleString()}
            hint="Inter-facility shipments"
            icon={Truck}
          />
          <StatCard
            label="Draft Orders"
            value={draftCount.toLocaleString()}
            hint="Awaiting dispatch approval"
            icon={Clock}
          />
          <StatCard
            label="In Transit"
            value={inTransitCount.toLocaleString()}
            hint="Active stock movements"
            icon={Truck}
          />
          <StatCard
            label="Completed"
            value={completedCount.toLocaleString()}
            hint="Stock posted at destination"
            icon={CheckCircle2}
          />
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transfer #, warehouse, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
            {/* Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {statusFilter !== "ALL" && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.2 text-[10px]">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 space-y-4" align="end">
                <div className="font-medium text-sm border-b pb-2">Filter Transfers</div>
                <div className="space-y-2">
                  <Label className="text-xs">Transfer Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setStatusFilter("ALL")}>
                    Reset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Column Toggle */}
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
                  checked={visibleCols.transferNumber}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, transferNumber: Boolean(v) }))}
                >
                  Transfer No.
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.source}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, source: Boolean(v) }))}
                >
                  Source Facility
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.destination}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, destination: Boolean(v) }))}
                >
                  Destination Facility
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.itemsCount}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, itemsCount: Boolean(v) }))}
                >
                  Item Lines
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.status}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, status: Boolean(v) }))}
                >
                  Status Flow
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.timestamps}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, timestamps: Boolean(v) }))}
                >
                  Timestamps
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
                {visibleCols.transferNumber && <TableHead>Transfer #</TableHead>}
                {visibleCols.source && <TableHead>Source Warehouse</TableHead>}
                {visibleCols.destination && <TableHead>Destination Warehouse</TableHead>}
                {visibleCols.itemsCount && <TableHead>Line Items</TableHead>}
                {visibleCols.status && <TableHead>Status</TableHead>}
                {visibleCols.timestamps && <TableHead>Timestamps</TableHead>}
                {visibleCols.actions && <TableHead className="w-12 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Loading stock transfers...
                  </TableCell>
                </TableRow>
              ) : filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      title="No stock transfers found"
                      description="Create an inter-warehouse shipment to move stock safely between facilities."
                      action={
                        canTransfer ? (
                          <Button size="sm" onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" /> New Stock Transfer
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((t) => {
                  const statusBadge = getTransferStatusBadge(t.status);
                  const isDraft = t.status === "DRAFT";
                  const isInTransit = t.status === "IN_TRANSIT";

                  return (
                    <TableRow key={t.id}>
                      {visibleCols.transferNumber && (
                        <TableCell className="font-mono font-medium text-sm">
                          {t.transferNumber}
                        </TableCell>
                      )}
                      {visibleCols.source && (
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-medium text-sm">
                              {t.sourceWarehouse?.name || "Unknown"}
                            </span>
                            {t.sourceWarehouse?.code && (
                              <span className="text-muted-foreground font-mono">
                                Code: {t.sourceWarehouse.code}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.destination && (
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-medium text-sm">
                              {t.destWarehouse?.name || "Unknown"}
                            </span>
                            {t.destWarehouse?.code && (
                              <span className="text-muted-foreground font-mono">
                                Code: {t.destWarehouse.code}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.itemsCount && (
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-medium">{t.items?.length || 0} Lines</span>
                            {t.items && t.items.length > 0 && (
                              <span className="text-muted-foreground truncate max-w-[180px]">
                                {t.items[0]?.product?.name || "Product"} (x{t.items[0]?.requestedQty})
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.status && (
                        <TableCell>
                          <Badge className={`text-[11px] ${statusBadge.style}`}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleCols.timestamps && (
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex flex-col">
                            <span>
                              Created: {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                            {t.shippedAt && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                Shipped: {new Date(t.shippedAt).toLocaleDateString()}
                              </span>
                            )}
                            {t.receivedAt && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                Received: {new Date(t.receivedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
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
                              {canTransfer && isDraft && (
                                <DropdownMenuItem onClick={() => handleStatusTransition(t.id, "IN_TRANSIT")}>
                                  <Truck className="mr-2 h-4 w-4 text-amber-500" /> Ship Transfer (In Transit)
                                </DropdownMenuItem>
                              )}
                              {canTransfer && isInTransit && (
                                <DropdownMenuItem onClick={() => handleStatusTransition(t.id, "COMPLETED")}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Receive & Complete Transfer
                                </DropdownMenuItem>
                              )}
                              {canTransfer && isDraft && (
                                <DropdownMenuItem onClick={() => handleStatusTransition(t.id, "CANCELLED")}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" /> Cancel Transfer
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

        {/* Create Transfer Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Create Stock Transfer</DialogTitle>
              <DialogDescription>
                Initiate an inter-facility shipment between source and destination warehouses.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTransfer} className="space-y-4 py-2">
              {errorMsg && (
                <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceWh">Source Warehouse *</Label>
                  <Select
                    value={sourceWhId}
                    onValueChange={(val) => {
                      setSourceWhId(val);
                      setSourceLocId("");
                    }}
                  >
                    <SelectTrigger id="sourceWh">
                      <SelectValue placeholder="Select source" />
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
                  <Label htmlFor="destWh">Destination Warehouse *</Label>
                  <Select
                    value={destWhId}
                    onValueChange={(val) => {
                      setDestWhId(val);
                      setDestLocId("");
                    }}
                  >
                    <SelectTrigger id="destWh">
                      <SelectValue placeholder="Select destination" />
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
              </div>

              <div className="space-y-2 border-t pt-3">
                <Label className="font-semibold text-xs text-muted-foreground uppercase">
                  Line Item Details
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="product">Product *</Label>
                    <Select value={productId} onValueChange={setProductId}>
                      <SelectTrigger id="product">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="sourceLoc">Source Location *</Label>
                      <Select value={sourceLocId} onValueChange={setSourceLocId}>
                        <SelectTrigger id="sourceLoc">
                          <SelectValue placeholder="Source bay" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceLocations.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name} ({l.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="destLoc">Destination Location *</Label>
                      <Select value={destLocId} onValueChange={setDestLocId}>
                        <SelectTrigger id="destLoc">
                          <SelectValue placeholder="Destination bay" />
                        </SelectTrigger>
                        <SelectContent>
                          {destLocations.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name} ({l.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="qty">Requested Quantity *</Label>
                    <Input
                      id="qty"
                      type="number"
                      min="1"
                      value={requestedQty}
                      onChange={(e) => setRequestedQty(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <Label htmlFor="notes">Transfer Notes / Order Instructions</Label>
                <Textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional shipment notes, transport route, or truck instructions..."
                  rows={2}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Create Transfer Draft
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

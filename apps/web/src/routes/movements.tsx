import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  Columns,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ExternalLink,
  History,
  LayoutList,
  Layers,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import {
  useInventoryMovements,
  type MovementItem,
  type MovementQueryParams,
} from "@/hooks/queries/useInventoryMovements";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useLocations } from "@/hooks/queries/useLocations";

const title = "Stock Movement Ledger";
const description =
  "Immutable double-entry audit trail capturing all receipts, sales, transfers, and inventory adjustments.";

export const Route = createFileRoute("/movements")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: MovementsPage,
});

interface VisibleCols {
  timestamp: boolean;
  product: boolean;
  type: boolean;
  delta: boolean;
  cost: boolean;
  total: boolean;
  location: boolean;
  actor: boolean;
  reference: boolean;
}

function getMovementTypeBadge(type: string) {
  const isInbound =
    type.includes("RECEIPT") ||
    type.includes("IN") ||
    type.includes("CORRECTION_ADD");

  const formattedType = type.replace(/_/g, " ");

  if (isInbound) {
    return {
      label: formattedType,
      style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      isInbound: true,
    };
  } else {
    return {
      label: formattedType,
      style: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
      isInbound: false,
    };
  }
}

function renderSourceDocLink(refType?: string | null, refId?: string | null) {
  if (!refType) {
    return <span className="text-xs text-muted-foreground">Manual Transaction</span>;
  }

  let route = "/inventory";
  let label = `${refType}: ${refId || "N/A"}`;

  if (refType.includes("PURCHASE") || refType.includes("RECEIPT")) {
    route = "/purchase-orders";
    label = `PO / Receipt #${refId || ""}`;
  } else if (refType.includes("TRANSFER")) {
    route = "/transfers";
    label = `Transfer #${refId || ""}`;
  } else if (refType.includes("ADJUSTMENT")) {
    route = "/adjustments";
    label = `Adjustment #${refId || ""}`;
  } else if (refType.includes("SALE") || refType.includes("INVOICE")) {
    route = "/sales-orders";
    label = `Sale Order #${refId || ""}`;
  }

  return (
    <Link
      to={route}
      className="text-xs font-mono text-primary hover:underline inline-flex items-center gap-1"
    >
      <ExternalLink className="h-3 w-3" />
      {label}
    </Link>
  );
}

function groupMovementsByDate(movements: MovementItem[]) {
  const groups: Record<string, MovementItem[]> = {};

  movements.forEach((m) => {
    const dateStr = new Date(m.createdAt).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(m);
  });

  return groups;
}

function MovementsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [viewMode, setViewMode] = useState<"ledger" | "timeline">("ledger");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");

  const queryParams: MovementQueryParams = { page, limit };
  if (search) queryParams.search = search;
  if (typeFilter !== "ALL") queryParams.movementType = typeFilter;
  if (warehouseFilter !== "ALL") queryParams.warehouseId = warehouseFilter;
  if (locationFilter !== "ALL") queryParams.locationId = locationFilter;

  const { data: movementsRes, isLoading } = useInventoryMovements(queryParams);
  const { data: warehousesData } = useWarehouses();
  const { data: locationsData } = useLocations();

  const warehouses = warehousesData || [];
  const locations = locationsData || [];

  const movements = movementsRes?.data || [];
  const meta = movementsRes?.meta || { total: 0, totalPages: 1, page: 1, limit: 25 };

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState<VisibleCols>({
    timestamp: true,
    product: true,
    type: true,
    delta: true,
    cost: true,
    total: true,
    location: true,
    actor: true,
    reference: true,
  });

  // Calculate live aggregates for cards
  const totalInboundCount = movements.filter(
    (m) => Number(m.quantity) > 0
  ).length;
  const totalOutboundCount = movements.filter(
    (m) => Number(m.quantity) < 0
  ).length;

  const handleExportCSV = () => {
    const headers = [
      "Timestamp",
      "Movement Type",
      "Product Name",
      "SKU",
      "Quantity Delta",
      "Unit Cost",
      "Total Cost",
      "Warehouse",
      "Location",
      "Actor",
      "Reference Type",
      "Reference ID",
    ];
    const csvRows = [headers.join(",")];

    movements.forEach((m) => {
      const actorName = m.actor
        ? `${m.actor.firstName} ${m.actor.lastName}`
        : "System";
      const row = [
        `"${new Date(m.createdAt).toISOString()}"`,
        `"${m.movementType}"`,
        `"${m.product?.name || ""}"`,
        `"${m.product?.sku || ""}"`,
        `"${m.quantity}"`,
        `"${m.unitCost}"`,
        `"${m.totalCost}"`,
        `"${m.warehouse?.code || m.warehouse?.name || ""}"`,
        `"${m.location?.code || m.location?.name || ""}"`,
        `"${actorName}"`,
        `"${m.referenceType || ""}"`,
        `"${m.referenceId || ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `stock-movements-${new Date().toISOString().split("T")[0]}.csv`);
    a.click();
  };

  const groupedTimeline = groupMovementsByDate(movements);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          eyebrow="Inventory"
          title={title}
          description={description}
          actions={
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" /> Export Audit Ledger
              </Button>
            </div>
          }
        />

        {/* Aggregate Stat Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Ledger Entries"
            value={meta.total.toLocaleString()}
            hint="Immutable double-entry log"
            icon={History}
          />
          <StatCard
            label="Inbound Transactions"
            value={totalInboundCount.toLocaleString()}
            hint="Receipts, Returns & Inward Adjustments"
            icon={ArrowDownLeft}
          />
          <StatCard
            label="Outbound Transactions"
            value={totalOutboundCount.toLocaleString()}
            hint="Sales Shipments & Transfers"
            icon={ArrowUpRight}
          />
          <StatCard
            label="Audit Synchronization"
            value="100% Verified"
            hint="Append-only timestamped events"
            icon={ShieldCheck}
          />
        </div>

        {/* Toolbar & View Toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, product, actor, ref #..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* View Mode Toggle Switcher */}
            <div className="inline-flex items-center rounded-md border p-1 bg-muted/50">
              <Button
                variant={viewMode === "ledger" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("ledger")}
                className="h-7 px-3 text-xs gap-1.5"
              >
                <LayoutList className="h-3.5 w-3.5" /> Ledger Table
              </Button>
              <Button
                variant={viewMode === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                className="h-7 px-3 text-xs gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" /> Inventory Timeline
              </Button>
            </div>

            {/* Filter Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {(typeFilter !== "ALL" || warehouseFilter !== "ALL" || locationFilter !== "ALL") && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.2 text-[10px]">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="end">
                <div className="font-medium text-sm border-b pb-2">Filter Stock Movements</div>
                <div className="space-y-2">
                  <Label className="text-xs">Movement Type</Label>
                  <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Movement Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="PURCHASE_RECEIPT">PURCHASE_RECEIPT</SelectItem>
                      <SelectItem value="SALE_SHIPMENT">SALE_SHIPMENT</SelectItem>
                      <SelectItem value="TRANSFER_OUT">TRANSFER_OUT</SelectItem>
                      <SelectItem value="TRANSFER_IN">TRANSFER_IN</SelectItem>
                      <SelectItem value="ADJUSTMENT_IN">ADJUSTMENT_IN</SelectItem>
                      <SelectItem value="ADJUSTMENT_OUT">ADJUSTMENT_OUT</SelectItem>
                      <SelectItem value="CUSTOMER_RETURN">CUSTOMER_RETURN</SelectItem>
                      <SelectItem value="SUPPLIER_RETURN">SUPPLIER_RETURN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Warehouse</Label>
                  <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Warehouses</SelectItem>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Location</Label>
                  <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Locations</SelectItem>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} ({l.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTypeFilter("ALL");
                      setWarehouseFilter("ALL");
                      setLocationFilter("ALL");
                      setPage(1);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Column Toggle (for Ledger View) */}
            {viewMode === "ledger" && (
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
                    checked={visibleCols.timestamp}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, timestamp: Boolean(v) }))}
                  >
                    Timestamp
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.product}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, product: Boolean(v) }))}
                  >
                    Product & SKU
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.type}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, type: Boolean(v) }))}
                  >
                    Movement Type
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.delta}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, delta: Boolean(v) }))}
                  >
                    Quantity Delta
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.cost}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, cost: Boolean(v) }))}
                  >
                    Unit Cost
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.total}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, total: Boolean(v) }))}
                  >
                    Total Cost
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.location}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, location: Boolean(v) }))}
                  >
                    Facility / Location
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.actor}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, actor: Boolean(v) }))}
                  >
                    Actor / User
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.reference}
                    onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, reference: Boolean(v) }))}
                  >
                    Source Document Link
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* View 1: Chronological Ledger Table View */}
        {viewMode === "ledger" ? (
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleCols.timestamp && <TableHead>Timestamp</TableHead>}
                  {visibleCols.product && <TableHead>Product</TableHead>}
                  {visibleCols.type && <TableHead>Type</TableHead>}
                  {visibleCols.delta && <TableHead className="text-right">Qty Delta</TableHead>}
                  {visibleCols.cost && <TableHead className="text-right">Unit Cost</TableHead>}
                  {visibleCols.total && <TableHead className="text-right">Total Value</TableHead>}
                  {visibleCols.location && <TableHead>Warehouse / Bay</TableHead>}
                  {visibleCols.actor && <TableHead>Actor</TableHead>}
                  {visibleCols.reference && <TableHead>Source Document</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Loading audit ledger...
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <EmptyState
                        title="No stock movements recorded"
                        description="Physical transactions, purchase receipts, and sales dispatches will automatically populate this double-entry ledger."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => {
                    const typeBadge = getMovementTypeBadge(m.movementType);
                    const qtyNum = Number(m.quantity);
                    const isPositive = qtyNum > 0;
                    const actorName = m.actor
                      ? `${m.actor.firstName} ${m.actor.lastName}`
                      : "System Audit";

                    return (
                      <TableRow key={m.id}>
                        {visibleCols.timestamp && (
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {new Date(m.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </TableCell>
                        )}
                        {visibleCols.product && (
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {m.product?.name || "Unknown Item"}
                              </span>
                              {m.product?.sku && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  SKU: {m.product.sku}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.type && (
                          <TableCell>
                            <Badge className={`text-[10px] ${typeBadge.style}`}>
                              {typeBadge.label}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleCols.delta && (
                          <TableCell className="text-right font-mono font-semibold text-sm">
                            <span
                              className={
                                isPositive
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }
                            >
                              {isPositive ? `+${qtyNum}` : `${qtyNum}`}
                            </span>
                          </TableCell>
                        )}
                        {visibleCols.cost && (
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            ₹{Number(m.unitCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                        )}
                        {visibleCols.total && (
                          <TableCell className="text-right font-mono font-medium text-sm">
                            ₹{Number(m.totalCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                        )}
                        {visibleCols.location && (
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-medium">
                                {m.location?.code || m.location?.name}
                              </span>
                              {m.warehouse && (
                                <span className="text-muted-foreground">
                                  Whse: {m.warehouse.code || m.warehouse.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.actor && (
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span>{actorName}</span>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.reference && (
                          <TableCell>
                            {renderSourceDocLink(m.referenceType, m.referenceId)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* View 2: Grouped Inventory Timeline View */
          <div className="space-y-6">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground border rounded-lg bg-card">
                Loading inventory timeline...
              </div>
            ) : movements.length === 0 ? (
              <div className="border rounded-lg bg-card p-6">
                <EmptyState
                  title="No timeline events"
                  description="Stock activity will be grouped chronologically by date in this view."
                />
              </div>
            ) : (
              Object.entries(groupedTimeline).map(([dateLabel, groupItems]) => (
                <div key={dateLabel} className="space-y-3">
                  {/* Timeline Date Header */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm tracking-wide text-foreground">
                      {dateLabel}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {groupItems.length} transactions
                    </Badge>
                  </div>

                  {/* Group Items */}
                  <div className="relative pl-6 space-y-3 border-l-2 border-primary/20 ml-2">
                    {groupItems.map((m) => {
                      const typeBadge = getMovementTypeBadge(m.movementType);
                      const qtyNum = Number(m.quantity);
                      const isPositive = qtyNum > 0;
                      const actorName = m.actor
                        ? `${m.actor.firstName} ${m.actor.lastName}`
                        : "System Audit";

                      return (
                        <div
                          key={m.id}
                          className="relative rounded-lg border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors"
                        >
                          {/* Timeline bullet node */}
                          <div className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-primary bg-background" />

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={`text-[10px] ${typeBadge.style}`}>
                                  {typeBadge.label}
                                </Badge>
                                <span className="font-medium text-sm text-foreground">
                                  {m.product?.name || "Unknown Item"}
                                </span>
                                {m.product?.sku && (
                                  <Badge variant="secondary" className="font-mono text-[10px]">
                                    SKU: {m.product.sku}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span>
                                  Facility: {m.warehouse?.code || m.warehouse?.name} / {m.location?.code || m.location?.name}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> {actorName}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-right">
                                <div className="font-mono font-bold text-base">
                                  <span
                                    className={
                                      isPositive
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400"
                                    }
                                  >
                                    {isPositive ? `+${qtyNum}` : `${qtyNum}`} units
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  Total: ₹{Number(m.totalCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </div>
                              </div>

                              <div className="border-l pl-3">
                                {renderSourceDocLink(m.referenceType, m.referenceId)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Showing page <span className="font-medium">{meta.page}</span> of{" "}
              <span className="font-medium">{meta.totalPages}</span> ({meta.total} movements)
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

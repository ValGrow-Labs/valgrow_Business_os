import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { EmptyState } from "@/components/foundation/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Search, Download, Filter, Columns, ArrowUpDown } from "lucide-react";
import { useInventoryStock, downloadStockExport, type StockHealthStatus } from "@/hooks/queries/useInventoryStock";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { useBranches } from "@/hooks/queries/useBranches";
import { useWarehouses } from "@/hooks/queries/useWarehouses";

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

function HealthBadge({ status }: { status: StockHealthStatus }) {
  if (status === "OUT") {
    return (
      <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive font-medium">
        Out of Stock
      </Badge>
    );
  }
  if (status === "LOW") {
    return (
      <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning font-medium">
        Low Stock
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-success/40 bg-success/10 text-success font-medium">
      OK
    </Badge>
  );
}

function InventoryStockPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState<string>("ALL");
  const [warehouseId, setWarehouseId] = useState<string>("ALL");
  const [health, setHealth] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    product: true,
    variant: true,
    facility: true,
    batch: true,
    onHand: true,
    reserved: true,
    available: true,
    health: true,
  });

  const { data: branchesData } = useBranches();
  const { data: warehousesData } = useWarehouses();

  const queryParams = {
    page,
    limit,
    search: search || undefined,
    branchId: branchId !== "ALL" ? branchId : undefined,
    warehouseId: warehouseId !== "ALL" ? warehouseId : undefined,
    health: health !== "ALL" ? (health as StockHealthStatus) : undefined,
    sortBy: sortBy || undefined,
    sortOrder,
  };

  const { data: stockData } = useInventoryStock(queryParams);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleExportCsv = () => {
    downloadStockExport("csv", queryParams);
  };

  const handleExportPdf = () => {
    downloadStockExport("pdf", queryParams);
  };

  const summary = stockData?.summary;
  const stats = [
    {
      label: "Total On Hand",
      value: summary ? String(summary.totalOnHand) : "0",
      hint: "Physical stock count",
    },
    {
      label: "Total Reserved",
      value: summary ? String(summary.totalReserved) : "0",
      hint: "Locked in carts & orders",
    },
    {
      label: "Total Available",
      value: summary ? String(summary.totalAvailable) : "0",
      hint: "Ready for sale/transfer",
    },
    {
      label: "Stock Health Alerts",
      value: summary ? `${summary.lowStockCount} Low / ${summary.outOfStockCount} Out` : "0 Low / 0 Out",
      hint: "Needs reordering",
    },
  ];

  const totalPages = stockData?.meta?.totalPages || 1;
  const rows = stockData?.data || [];

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Inventory"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="mr-1.5 h-4 w-4" />
              Export (CSV)
            </Button>
            <Button size="sm" onClick={handleExportPdf}>
              <Download className="mr-1.5 h-4 w-4" />
              Export stock report
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            {...(s.hint ? { hint: s.hint } : {})}
            tone={i === 0 ? "brand" : "default"}
          />
        ))}
      </div>


      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter records…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-1.5 h-4 w-4" />
                  Filters
                  {(branchId !== "ALL" || warehouseId !== "ALL" || health !== "ALL") && (
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-3">
                  <h4 className="font-semibold text-sm">Filter Stock Levels</h4>
                  
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Branch</label>
                    <Select value={branchId} onValueChange={(val) => { setBranchId(val); setPage(1); }}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Branches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Branches</SelectItem>
                        {branchesData?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Warehouse</label>
                    <Select value={warehouseId} onValueChange={(val) => { setWarehouseId(val); setPage(1); }}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Warehouses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Warehouses</SelectItem>
                        {warehousesData?.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Stock Health Status</label>
                    <Select value={health} onValueChange={(val) => { setHealth(val); setPage(1); }}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Health Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Health Statuses</SelectItem>
                        <SelectItem value="OK">OK (Normal Stock)</SelectItem>
                        <SelectItem value="LOW">Low Stock</SelectItem>
                        <SelectItem value="OUT">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(branchId !== "ALL" || warehouseId !== "ALL" || health !== "ALL") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-8 text-xs text-muted-foreground"
                      onClick={() => {
                        setBranchId("ALL");
                        setWarehouseId("ALL");
                        setHealth("ALL");
                        setPage(1);
                      }}
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Columns className="mr-1.5 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["product"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, product: Boolean(val) })}
                >
                  Product
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["variant"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, variant: Boolean(val) })}
                >
                  Variant
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["facility"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, facility: Boolean(val) })}
                >
                  Warehouse & Location
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["batch"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, batch: Boolean(val) })}
                >
                  Batch No.
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["onHand"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, onHand: Boolean(val) })}
                >
                  On Hand Qty
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["reserved"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, reserved: Boolean(val) })}
                >
                  Reserved Qty
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["available"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, available: Boolean(val) })}
                >
                  Available Stock
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["health"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, health: Boolean(val) })}
                >
                  Stock Health
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState className="rounded-none border-0" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {visibleCols["product"] && (
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("product")}>
                      <div className="flex items-center gap-1">
                        Product & SKU
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleCols["variant"] && <TableHead>Variant</TableHead>}
                  {visibleCols["facility"] && (
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("warehouse")}>
                      <div className="flex items-center gap-1">
                        Warehouse & Location
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleCols["batch"] && <TableHead>Batch No.</TableHead>}
                  {visibleCols["onHand"] && (
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("onHand")}>
                      <div className="flex items-center gap-1">
                        On Hand Qty
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleCols["reserved"] && (
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("reserved")}>
                      <div className="flex items-center gap-1">
                        Reserved Qty
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  )}
                  {visibleCols["available"] && <TableHead>Available Stock</TableHead>}
                  {visibleCols["health"] && <TableHead>Stock Health</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {visibleCols["product"] && (
                      <TableCell>
                        <div className="font-medium text-foreground">{row.product?.name || "Unassigned Product"}</div>
                        <div className="text-xs text-muted-foreground">{row.product?.sku ? `SKU: ${row.product.sku}` : "No SKU"}</div>
                      </TableCell>
                    )}
                    {visibleCols["variant"] && <TableCell>{row.variant?.name || "Base Product"}</TableCell>}
                    {visibleCols["facility"] && (
                      <TableCell>
                        <div className="font-medium">{row.warehouse?.name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{row.location?.name ? `Bin: ${row.location.name}` : "General Bin"}</div>
                      </TableCell>
                    )}
                    {visibleCols["batch"] && <TableCell>{row.batch?.batchNumber || "Non-Batched"}</TableCell>}
                    {visibleCols["onHand"] && <TableCell className="font-mono">{row.onHand} Units</TableCell>}
                    {visibleCols["reserved"] && <TableCell className="font-mono text-muted-foreground">{row.reserved} Units</TableCell>}
                    {visibleCols["available"] && <TableCell className="font-mono font-semibold text-foreground">{row.available} Units</TableCell>}
                    {visibleCols["health"] && (
                      <TableCell>
                        <HealthBadge status={row.stockHealth || "OK"} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
          <p className="px-2 text-xs text-muted-foreground">
            Showing {rows.length} of {stockData?.meta?.total || 0} live stock records
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {page} / {totalPages}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </AppShell>
  );
}



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
  Edit2,
  Download,
  Barcode,
  CheckCircle2,
  ShoppingBag,
  ShieldCheck,
  AlertOctagon,
  ExternalLink,
  MapPin,
} from "lucide-react";
import {
  useInventorySerialNumbers,
  useCreateSerial,
  useUpdateSerial,
  type SerialNumberItem,
  type SerialQueryParams,
} from "@/hooks/queries/useInventorySerialNumbers";
import { useProducts } from "@/hooks/queries/useProducts";
import { useLocations } from "@/hooks/queries/useLocations";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";

const title = "Serial Number Registry";
const description =
  "Individually tracked serialized hardware, high-value electronics, and asset traceabilities.";

export const Route = createFileRoute("/serial-numbers")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: SerialNumbersPage,
});

interface VisibleCols {
  serialNumber: boolean;
  product: boolean;
  status: boolean;
  location: boolean;
  linkedSale: boolean;
  warranty: boolean;
  actions: boolean;
}

function getSerialStatusBadge(status: string, warrantyEndDate?: string | null) {
  const isWarrantyValid =
    warrantyEndDate && new Date(warrantyEndDate).getTime() > new Date().getTime();

  switch (status) {
    case "AVAILABLE":
      return {
        label: "In Stock",
        style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      };
    case "SOLD":
      return {
        label: isWarrantyValid ? "Sold (In Warranty)" : "Sold",
        style: isWarrantyValid
          ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
          : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      };
    case "UNDER_WARRANTY":
      return {
        label: "Under Warranty",
        style: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      };
    case "RETURNED":
      return {
        label: "Returned",
        style: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      };
    case "DEFECTIVE":
      return {
        label: "Defective",
        style: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      };
    default:
      return {
        label: status,
        style: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      };
  }
}

function SerialNumbersPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.length === 0 || permissions.includes("inventory.create");
  const canUpdate = permissions.length === 0 || permissions.includes("inventory.update");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  // Query hooks
  const queryParams: SerialQueryParams = {};
  if (search) queryParams.search = search;
  if (statusFilter !== "ALL") queryParams.status = statusFilter;
  if (warehouseFilter !== "ALL") queryParams.warehouseId = warehouseFilter;

  const { data: serialsData, isLoading } = useInventorySerialNumbers(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );

  const { data: productsRes } = useProducts({ limit: 100 });
  const products = productsRes?.data || [];

  const { data: locationsData } = useLocations();
  const locations = locationsData || [];

  const { data: warehousesData } = useWarehouses();
  const warehouses = warehousesData || [];

  const createMutation = useCreateSerial();
  const updateMutation = useUpdateSerial();

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSerial, setEditingSerial] = useState<SerialNumberItem | null>(null);
  const [formProductId, setFormProductId] = useState("");
  const [formLocationId, setFormLocationId] = useState("");
  const [formSerialNumber, setFormSerialNumber] = useState("");
  const [formStatus, setFormStatus] = useState<SerialNumberItem["status"]>("AVAILABLE");
  const [formWarrantyEndDate, setFormWarrantyEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState<VisibleCols>({
    serialNumber: true,
    product: true,
    status: true,
    location: true,
    linkedSale: true,
    warranty: true,
    actions: true,
  });

  const allSerials = serialsData || [];

  const availableCount = allSerials.filter((s) => s.status === "AVAILABLE").length;
  const soldCount = allSerials.filter((s) => s.status === "SOLD").length;
  const warrantyCount = allSerials.filter((s) => {
    if (s.status === "UNDER_WARRANTY") return true;
    if (s.warrantyEndDate && new Date(s.warrantyEndDate).getTime() > new Date().getTime()) {
      return true;
    }
    return false;
  }).length;

  const handleOpenCreate = () => {
    setEditingSerial(null);
    setFormProductId(products[0]?.id || "");
    setFormLocationId(locations[0]?.id || "");
    setFormSerialNumber(`SN-${Date.now().toString().slice(-8)}`);
    setFormStatus("AVAILABLE");
    setFormWarrantyEndDate("");
    setFormNotes("");
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (serial: SerialNumberItem) => {
    setEditingSerial(serial);
    setFormProductId(serial.productId);
    setFormLocationId(serial.locationId);
    setFormSerialNumber(serial.serialNumber);
    setFormStatus(serial.status);
    setFormWarrantyEndDate(
      serial.warrantyEndDate ? serial.warrantyEndDate.split("T")[0] || "" : ""
    );
    setFormNotes(serial.notes || "");
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
    if (!formLocationId) {
      setErrorMsg("Please select a location");
      return;
    }
    if (!formSerialNumber.trim()) {
      setErrorMsg("Serial number is required");
      return;
    }

    try {
      if (editingSerial) {
        await updateMutation.mutateAsync({
          id: editingSerial.id,
          data: {
            productId: formProductId,
            locationId: formLocationId,
            serialNumber: formSerialNumber.trim(),
            status: formStatus,
            warrantyEndDate: formWarrantyEndDate ? new Date(formWarrantyEndDate).toISOString() : null,
            notes: formNotes.trim() || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          productId: formProductId,
          locationId: formLocationId,
          serialNumber: formSerialNumber.trim(),
          status: formStatus,
          warrantyEndDate: formWarrantyEndDate ? new Date(formWarrantyEndDate).toISOString() : null,
          notes: formNotes.trim() || null,
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save serial number");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Serial Number",
      "Product Name",
      "SKU",
      "Status",
      "Location",
      "Warehouse",
      "Linked Sales Order",
      "Linked Sales Invoice",
      "Warranty End Date",
      "Notes",
    ];
    const csvRows = [headers.join(",")];

    allSerials.forEach((s) => {
      const row = [
        `"${s.serialNumber}"`,
        `"${s.product?.name || ""}"`,
        `"${s.product?.sku || ""}"`,
        `"${s.status}"`,
        `"${s.location?.name || ""}"`,
        `"${s.location?.warehouse?.name || ""}"`,
        `"${s.salesOrder?.orderNumber || ""}"`,
        `"${s.salesInvoice?.invoiceNumber || ""}"`,
        `"${s.warrantyEndDate ? s.warrantyEndDate.split("T")[0] : ""}"`,
        `"${s.notes || ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `serial-numbers-${new Date().toISOString().split("T")[0]}.csv`);
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
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              {canCreate && (
                <Button size="sm" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Register Serial
                </Button>
              )}
            </div>
          }
        />

        {/* Aggregate Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Serials"
            value={allSerials.length.toLocaleString()}
            hint="Registered hardware assets"
            icon={Barcode}
          />
          <StatCard
            label="In Stock (Available)"
            value={availableCount.toLocaleString()}
            hint="Ready for sales & fulfillment"
            icon={CheckCircle2}
          />
          <StatCard
            label="Dispatched / Sold"
            value={soldCount.toLocaleString()}
            hint="Delivered to customer"
            icon={ShoppingBag}
          />
          <StatCard
            label="Active Warranty / Service"
            value={warrantyCount.toLocaleString()}
            hint="Covered under warranty"
            icon={ShieldCheck}
          />
        </div>

        {/* Toolbar & Fast Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Fast exact-match serial search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 font-mono text-sm"
              />
            </div>
            {search.trim() && (
              <Badge variant="secondary" className="text-[11px] font-mono">
                Exact-Match-First Priority
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {(statusFilter !== "ALL" || warehouseFilter !== "ALL") && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.2 text-[10px]">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="end">
                <div className="font-medium text-sm border-b pb-2">Filter Serial Numbers</div>
                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="AVAILABLE">AVAILABLE (In Stock)</SelectItem>
                      <SelectItem value="SOLD">SOLD (Dispatched)</SelectItem>
                      <SelectItem value="UNDER_WARRANTY">UNDER_WARRANTY</SelectItem>
                      <SelectItem value="RETURNED">RETURNED</SelectItem>
                      <SelectItem value="DEFECTIVE">DEFECTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Warehouse</Label>
                  <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
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
                <div className="flex justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setWarehouseFilter("ALL");
                    }}
                  >
                    Reset Filters
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
                  checked={visibleCols.serialNumber}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, serialNumber: Boolean(v) }))}
                >
                  Serial Number
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.product}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, product: Boolean(v) }))}
                >
                  Product & SKU
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.status}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, status: Boolean(v) }))}
                >
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.location}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, location: Boolean(v) }))}
                >
                  Warehouse & Location
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.linkedSale}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, linkedSale: Boolean(v) }))}
                >
                  Linked Sale Record
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleCols.warranty}
                  onCheckedChange={(v) => setVisibleCols((c) => ({ ...c, warranty: Boolean(v) }))}
                >
                  Warranty Coverage
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
                {visibleCols.serialNumber && <TableHead>Serial Number</TableHead>}
                {visibleCols.product && <TableHead>Product</TableHead>}
                {visibleCols.status && <TableHead>Status</TableHead>}
                {visibleCols.location && <TableHead>Location / Facility</TableHead>}
                {visibleCols.linkedSale && <TableHead>Linked Sale</TableHead>}
                {visibleCols.warranty && <TableHead>Warranty Expiry</TableHead>}
                {visibleCols.actions && <TableHead className="w-12 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Loading serial numbers...
                  </TableCell>
                </TableRow>
              ) : allSerials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      title="No serial numbers registered"
                      description="Track high-value hardware items individually by serial number."
                      action={
                        canCreate ? (
                          <Button size="sm" onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Register Serial
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                allSerials.map((serial) => {
                  const statusBadge = getSerialStatusBadge(serial.status, serial.warrantyEndDate);
                  const isExactMatch =
                    search.trim() &&
                    serial.serialNumber.toLowerCase() === search.trim().toLowerCase();

                  return (
                    <TableRow key={serial.id} className={isExactMatch ? "bg-primary/5" : undefined}>
                      {visibleCols.serialNumber && (
                        <TableCell className="font-mono font-medium text-sm">
                          <div className="flex items-center gap-2">
                            <span>{serial.serialNumber}</span>
                            {isExactMatch && (
                              <Badge variant="default" className="text-[9px] px-1 py-0">
                                Exact Match
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.product && (
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {serial.product?.name || "Unknown Product"}
                            </span>
                            {serial.product?.sku && (
                              <span className="text-xs font-mono text-muted-foreground">
                                SKU: {serial.product.sku}
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
                      {visibleCols.location && (
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-medium">
                              {serial.location?.name} ({serial.location?.code})
                            </span>
                            {serial.location?.warehouse && (
                              <span className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3 inline" />
                                {serial.location.warehouse.name} ({serial.location.warehouse.code})
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.linkedSale && (
                        <TableCell>
                          {serial.salesOrder ? (
                            <Link
                              to="/sales-orders"
                              className="text-xs font-mono text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Order: {serial.salesOrder.orderNumber}
                            </Link>
                          ) : serial.salesInvoice ? (
                            <Link
                              to="/sales-invoices"
                              className="text-xs font-mono text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Invoice: {serial.salesInvoice.invoiceNumber}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {visibleCols.warranty && (
                        <TableCell className="text-xs">
                          {serial.warrantyEndDate ? (
                            <div className="flex flex-col">
                              <span>
                                {new Date(serial.warrantyEndDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {new Date(serial.warrantyEndDate).getTime() > new Date().getTime() ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  Warranty Active
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  Warranty Expired
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No Warranty</span>
                          )}
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
                                <DropdownMenuItem onClick={() => handleOpenEdit(serial)}>
                                  <Edit2 className="mr-2 h-4 w-4" /> Edit Serial
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

        {/* Create / Edit Serial Number Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingSerial ? "Edit Serial Number" : "Register Serial Number"}
              </DialogTitle>
              <DialogDescription>
                Assign hardware serial number, location bay, warranty coverage, and status.
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

              <div className="space-y-2">
                <Label htmlFor="locationId">Storage Location *</Label>
                <Select value={formLocationId} onValueChange={setFormLocationId}>
                  <SelectTrigger id="locationId">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number *</Label>
                  <Input
                    id="serialNumber"
                    value={formSerialNumber}
                    onChange={(e) => setFormSerialNumber(e.target.value)}
                    placeholder="e.g. SN-8839201"
                    className="font-mono text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formStatus}
                    onValueChange={(v) => setFormStatus(v as SerialNumberItem["status"])}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">AVAILABLE (In Stock)</SelectItem>
                      <SelectItem value="SOLD">SOLD (Dispatched)</SelectItem>
                      <SelectItem value="UNDER_WARRANTY">UNDER_WARRANTY</SelectItem>
                      <SelectItem value="RETURNED">RETURNED</SelectItem>
                      <SelectItem value="DEFECTIVE">DEFECTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyEndDate">Warranty Expiry Date</Label>
                <Input
                  id="warrantyEndDate"
                  type="date"
                  value={formWarrantyEndDate}
                  onChange={(e) => setFormWarrantyEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Inspection Comments</Label>
                <Textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional technical notes, hardware batch, or condition comments..."
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingSerial ? "Save Changes" : "Register Serial"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

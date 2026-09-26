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
import { Checkbox } from "@/components/ui/checkbox";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Search, Plus, Filter, Columns, MoreHorizontal, Eye, Edit2, Power, Building2, MapPin, Package } from "lucide-react";
import {
  useWarehouses,
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  type WarehouseItem,
} from "@/hooks/queries/useWarehouses";
import { useBranches } from "@/hooks/queries/useBranches";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";

const title = "Warehouses";
const description = "Physical storage facilities, depots, and regional distribution centers.";

export const Route = createFileRoute("/warehouses")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: WarehousesPage,
});

function WarehousesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.length === 0 || permissions.includes("inventory.create");
  const canUpdate = permissions.length === 0 || permissions.includes("inventory.update");
  const canDelete = permissions.length === 0 || permissions.includes("inventory.delete");

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected warehouse for detail view drawer
  const [detailId, setDetailId] = useState<string | null>(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formBranchId, setFormBranchId] = useState<string>("NONE");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    name: true,
    code: true,
    branch: true,
    city: true,
    locations: true,
    isDefault: true,
    status: true,
    actions: true,
  });

  const { data: branchesData } = useBranches();
  const { data: warehousesData, isLoading } = useWarehouses({
    branchId: branchFilter !== "ALL" ? branchFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  const { data: detailWarehouse } = useWarehouse(detailId || "");

  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  const resetForm = () => {
    setEditingWarehouse(null);
    setFormName("");
    setFormCode("");
    setFormBranchId("NONE");
    setFormAddress("");
    setFormCity("");
    setFormIsDefault(false);
    setFormStatus("ACTIVE");
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (wh: WarehouseItem) => {
    setEditingWarehouse(wh);
    setFormName(wh.name);
    setFormCode(wh.code);
    setFormBranchId(wh.branchId || "NONE");
    setFormAddress(wh.address || "");
    setFormCity(wh.city || "");
    setFormIsDefault(wh.isDefault);
    setFormStatus(wh.status);
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formName.trim() || !formCode.trim()) {
      setErrorMsg("Warehouse Name and Code are required.");
      return;
    }

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      branchId: formBranchId !== "NONE" ? formBranchId : null,
      address: formAddress.trim() || null,
      city: formCity.trim() || null,
      isDefault: formIsDefault,
      status: formStatus,
    };

    try {
      if (editingWarehouse) {
        await updateMutation.mutateAsync({ id: editingWarehouse.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save warehouse record.");
    }
  };

  const handleToggleStatus = async (wh: WarehouseItem) => {
    const nextStatus = wh.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMutation.mutateAsync({ id: wh.id, data: { status: nextStatus } });
    } catch (err: any) {
      alert(err?.message || "Failed to update warehouse status.");
    }
  };

  // Filtered rows
  const filteredWarehouses = (warehousesData || []).filter((w) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.code.toLowerCase().includes(q) ||
      (w.city && w.city.toLowerCase().includes(q)) ||
      (w.branch && w.branch.name.toLowerCase().includes(q))
    );
  });

  const totalWarehouses = warehousesData?.length || 0;
  const activeCount = warehousesData?.filter((w) => w.status === "ACTIVE").length || 0;
  const branchAssignedCount = warehousesData?.filter((w) => Boolean(w.branchId)).length || 0;
  const totalLocations = warehousesData?.reduce((acc, curr) => acc + (curr._count?.locations || 0), 0) || 0;

  const stats = [
    { label: "Total Warehouses", value: String(totalWarehouses), hint: "All registered facilities" },
    { label: "Active Depots", value: String(activeCount), hint: "Operational storage" },
    { label: "Branch Assigned", value: String(branchAssignedCount), hint: "Regional assignment" },
    { label: "Total Active Locations", value: String(totalLocations), hint: "Bins, racks & aisles" },
  ];

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Inventory"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            {canCreate && (
              <Button size="sm" onClick={handleOpenCreate} className="text-xs sm:text-sm">
                <Plus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>New warehouse</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border p-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter records…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-1.5 h-4 w-4" />
                  Filters
                  {(branchFilter !== "ALL" || statusFilter !== "ALL") && (
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-3">
                  <h4 className="font-semibold text-sm">Filter Warehouses</h4>
                  
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Branch</label>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
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
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active Only</SelectItem>
                        <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(branchFilter !== "ALL" || statusFilter !== "ALL") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-8 text-xs text-muted-foreground"
                      onClick={() => {
                        setBranchFilter("ALL");
                        setStatusFilter("ALL");
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
                  checked={Boolean(visibleCols["name"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, name: Boolean(val) })}
                >
                  Warehouse
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["code"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, code: Boolean(val) })}
                >
                  Code
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["branch"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, branch: Boolean(val) })}
                >
                  Assigned Branch
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["city"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, city: Boolean(val) })}
                >
                  City & Address
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["locations"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, locations: Boolean(val) })}
                >
                  Locations Count
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["isDefault"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, isDefault: Boolean(val) })}
                >
                  Default Facility
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["status"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, status: Boolean(val) })}
                >
                  Status
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {filteredWarehouses.length === 0 ? (
          <EmptyState className="rounded-none border-0" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {visibleCols["name"] && <TableHead>Warehouse</TableHead>}
                  {visibleCols["code"] && <TableHead>Code</TableHead>}
                  {visibleCols["branch"] && <TableHead>Assigned Branch</TableHead>}
                  {visibleCols["city"] && <TableHead>City & Address</TableHead>}
                  {visibleCols["locations"] && <TableHead>Locations</TableHead>}
                  {visibleCols["isDefault"] && <TableHead>Primary Facility</TableHead>}
                  {visibleCols["status"] && <TableHead>Status</TableHead>}
                  {visibleCols["actions"] && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((wh) => (
                  <TableRow key={wh.id}>
                    {visibleCols["name"] && (
                      <TableCell className="font-medium text-foreground">
                        {wh.name}
                      </TableCell>
                    )}
                    {visibleCols["code"] && (
                      <TableCell className="font-mono text-xs">{wh.code}</TableCell>
                    )}
                    {visibleCols["branch"] && (
                      <TableCell>
                        {wh.branch ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{wh.branch.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Central / Unassigned</span>
                        )}
                      </TableCell>
                    )}
                    {visibleCols["city"] && (
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{wh.city || "N/A"}</span>
                        </div>
                        {wh.address && <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{wh.address}</div>}
                      </TableCell>
                    )}
                    {visibleCols["locations"] && (
                      <TableCell className="font-mono">{wh._count?.locations || 0} bins</TableCell>
                    )}
                    {visibleCols["isDefault"] && (
                      <TableCell>
                        {wh.isDefault ? (
                          <Badge variant="outline" className="border-brand/40 bg-brand/10 text-brand font-medium">
                            Primary Facility
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard</span>
                        )}
                      </TableCell>
                    )}
                    {visibleCols["status"] && (
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            wh.status === "ACTIVE"
                              ? "border-success/40 bg-success/10 text-success"
                              : "border-muted bg-muted text-muted-foreground"
                          }
                        >
                          {wh.status === "ACTIVE" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleCols["actions"] && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailId(wh.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => handleOpenEdit(wh)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Warehouse
                              </DropdownMenuItem>
                            )}
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => handleToggleStatus(wh)}>
                                <Power className="mr-2 h-4 w-4" />
                                {wh.status === "ACTIVE" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create / Edit Warehouse Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Create New Warehouse"}</DialogTitle>
            <DialogDescription>
              Enter facility location details, code, and regional branch assignment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="grid gap-4 py-2">
            {errorMsg && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="wh-name">Warehouse Name *</Label>
              <Input
                id="wh-name"
                placeholder="e.g. Central Distribution Hub"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="wh-code">Warehouse Code *</Label>
              <Input
                id="wh-code"
                placeholder="e.g. WH-MAIN-01"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="wh-branch">Assigned Branch</Label>
              <Select value={formBranchId} onValueChange={setFormBranchId}>
                <SelectTrigger id="wh-branch">
                  <SelectValue placeholder="Select Branch (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Central / Unassigned</SelectItem>
                  {branchesData?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="wh-city">City</Label>
                <Input
                  id="wh-city"
                  placeholder="e.g. Bangalore"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="wh-status">Status</Label>
                <Select value={formStatus} onValueChange={(val) => setFormStatus(val as any)}>
                  <SelectTrigger id="wh-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="wh-address">Address</Label>
              <Input
                id="wh-address"
                placeholder="e.g. Plot 42, Peenya Industrial Area Phase 3"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="wh-default"
                checked={formIsDefault}
                onCheckedChange={(val) => setFormIsDefault(Boolean(val))}
              />
              <Label htmlFor="wh-default" className="text-xs font-normal cursor-pointer">
                Set as Default Organization Facility
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingWarehouse ? "Save Changes" : "Create Warehouse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Warehouse Detail Drawer */}
      <Sheet open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5 text-brand" />
              {detailWarehouse?.name || "Warehouse Details"}
            </SheetTitle>
            <SheetDescription>
              Facility code: <span className="font-mono font-semibold">{detailWarehouse?.code}</span>
            </SheetDescription>
          </SheetHeader>

          {detailWarehouse && (
            <div className="grid gap-6 py-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Assigned Branch</div>
                  <div className="font-medium mt-0.5">{detailWarehouse.branch?.name || "Central / Unassigned"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">City & Region</div>
                  <div className="font-medium mt-0.5">{detailWarehouse.city || "N/A"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Street Address</div>
                  <div className="font-medium mt-0.5">{detailWarehouse.address || "No street address specified"}</div>
                </div>
              </div>

              {/* Current Stock Summary */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Current Stock Summary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border border-border p-3">
                    <div className="text-xs text-muted-foreground">On Hand Qty</div>
                    <div className="text-lg font-bold mt-1 font-mono">
                      {detailWarehouse.stockSummary?.totalOnHand ?? 0}
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <div className="text-xs text-muted-foreground">Reserved Qty</div>
                    <div className="text-lg font-bold mt-1 font-mono text-muted-foreground">
                      {detailWarehouse.stockSummary?.totalReserved ?? 0}
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <div className="text-xs text-muted-foreground">Available Stock</div>
                    <div className="text-lg font-bold mt-1 font-mono text-brand">
                      {detailWarehouse.stockSummary?.totalAvailable ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Storage Locations */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Storage Locations ({detailWarehouse.locations?.length || 0})</span>
                  <Badge variant="outline" className="text-[11px]">Active Bins & Racks</Badge>
                </h4>

                {detailWarehouse.locations && detailWarehouse.locations.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Location Code</TableHead>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Placement (Aisle/Rack/Bin)</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailWarehouse.locations.map((loc) => (
                          <TableRow key={loc.id}>
                            <TableCell className="font-mono text-xs font-semibold">{loc.code}</TableCell>
                            <TableCell className="text-xs">{loc.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {[loc.aisle && `Aisle ${loc.aisle}`, loc.rack && `Rack ${loc.rack}`, loc.bin && `Bin ${loc.bin}`]
                                .filter(Boolean)
                                .join(" / ") || "General Storage"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success/40 bg-success/10 text-success">
                                {loc.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                    No location bins configured for this warehouse yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}


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
import { Search, Plus, Filter, Columns, MoreHorizontal, Edit2, Power, Trash2, Building2, Layers, MapPin } from "lucide-react";
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  type LocationItem,
} from "@/hooks/queries/useLocations";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";

const title = "Warehouse Locations";
const description = "Physical shelf, bin, rack, and aisle positions within tenant warehouses.";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.length === 0 || permissions.includes("inventory.create");
  const canUpdate = permissions.length === 0 || permissions.includes("inventory.update");
  const canDelete = permissions.length === 0 || permissions.includes("inventory.delete");

  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formAisle, setFormAisle] = useState("");
  const [formRack, setFormRack] = useState("");
  const [formShelf, setFormShelf] = useState("");
  const [formBin, setFormBin] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    name: true,
    code: true,
    warehouse: true,
    hierarchy: true,
    isDefault: true,
    status: true,
    actions: true,
  });

  const { data: warehousesData } = useWarehouses();
  const { data: locationsData, isLoading } = useLocations({
    warehouseId: warehouseFilter !== "ALL" ? warehouseFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const resetForm = () => {
    const firstWh = warehousesData?.[0];
    setEditingLocation(null);
    setFormWarehouseId(firstWh ? firstWh.id : "");
    setFormName("");
    setFormCode("");
    setFormAisle("");
    setFormRack("");
    setFormShelf("");
    setFormBin("");
    setFormIsDefault(false);
    setFormStatus("ACTIVE");
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    const firstWh = warehousesData?.[0];
    if (firstWh) {
      setFormWarehouseId(warehouseFilter !== "ALL" ? warehouseFilter : firstWh.id);
    }
    setIsFormOpen(true);
  };


  const handleOpenEdit = (loc: LocationItem) => {
    setEditingLocation(loc);
    setFormWarehouseId(loc.warehouseId);
    setFormName(loc.name);
    setFormCode(loc.code);
    setFormAisle(loc.aisle || "");
    setFormRack(loc.rack || "");
    setFormShelf(loc.shelf || "");
    setFormBin(loc.bin || "");
    setFormIsDefault(loc.isDefault);
    setFormStatus(loc.status);
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formWarehouseId) {
      setErrorMsg("Please select a target warehouse.");
      return;
    }
    if (!formName.trim() || !formCode.trim()) {
      setErrorMsg("Location Name and Code are required.");
      return;
    }

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      aisle: formAisle.trim() || null,
      rack: formRack.trim() || null,
      shelf: formShelf.trim() || null,
      bin: formBin.trim() || null,
      isDefault: formIsDefault,
      status: formStatus,
    };

    try {
      if (editingLocation) {
        await updateMutation.mutateAsync({
          warehouseId: formWarehouseId,
          id: editingLocation.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync({
          warehouseId: formWarehouseId,
          data: payload,
        });
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save location record.");
    }
  };

  const handleToggleStatus = async (loc: LocationItem) => {
    const nextStatus = loc.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMutation.mutateAsync({
        warehouseId: loc.warehouseId,
        id: loc.id,
        data: { status: nextStatus },
      });
    } catch (err: any) {
      alert(err?.message || "Failed to update location status.");
    }
  };

  const handleDelete = async (loc: LocationItem) => {
    if (!confirm(`Are you sure you want to delete location '${loc.name}' (${loc.code})?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ warehouseId: loc.warehouseId, id: loc.id });
    } catch (err: any) {
      alert(err?.message || "Failed to delete location.");
    }
  };

  // Filtered rows
  const filteredLocations = (locationsData || []).filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      (l.aisle && l.aisle.toLowerCase().includes(q)) ||
      (l.bin && l.bin.toLowerCase().includes(q)) ||
      (l.warehouse && l.warehouse.name.toLowerCase().includes(q))
    );
  });

  const totalLocations = locationsData?.length || 0;
  const activeLocationsCount = locationsData?.filter((l) => l.status === "ACTIVE").length || 0;
  const defaultBaysCount = locationsData?.filter((l) => l.isDefault).length || 0;
  const binsCount = locationsData?.filter((l) => Boolean(l.bin)).length || 0;

  const stats = [
    { label: "Active Locations", value: String(activeLocationsCount), hint: "Operational storage positions" },
    { label: "Total Warehouses", value: String(warehousesData?.length || 0), hint: "Facility network" },
    { label: "Default Receiving Bays", value: String(defaultBaysCount), hint: "Primary dock locations" },
    { label: "Configured Storage Bins", value: String(binsCount), hint: "Specific bin allocations" },
  ];

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Inventory"
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                New location
              </Button>
            )}
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
                  {(warehouseFilter !== "ALL" || statusFilter !== "ALL") && (
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-3">
                  <h4 className="font-semibold text-sm">Filter Locations</h4>
                  
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Warehouse Facility</label>
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
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

                  {(warehouseFilter !== "ALL" || statusFilter !== "ALL") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-8 text-xs text-muted-foreground"
                      onClick={() => {
                        setWarehouseFilter("ALL");
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
                  Location Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["code"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, code: Boolean(val) })}
                >
                  Code
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["warehouse"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, warehouse: Boolean(val) })}
                >
                  Warehouse Facility
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["hierarchy"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, hierarchy: Boolean(val) })}
                >
                  Structural Hierarchy
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={Boolean(visibleCols["isDefault"])}
                  onCheckedChange={(val) => setVisibleCols({ ...visibleCols, isDefault: Boolean(val) })}
                >
                  Receiving Bay
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

        {filteredLocations.length === 0 ? (
          <EmptyState className="rounded-none border-0" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {visibleCols["name"] && <TableHead>Location Name</TableHead>}
                  {visibleCols["code"] && <TableHead>Code</TableHead>}
                  {visibleCols["warehouse"] && <TableHead>Warehouse Facility</TableHead>}
                  {visibleCols["hierarchy"] && <TableHead>Structural Hierarchy (Aisle → Rack → Shelf → Bin)</TableHead>}
                  {visibleCols["isDefault"] && <TableHead>Receiving Bay</TableHead>}
                  {visibleCols["status"] && <TableHead>Status</TableHead>}
                  {visibleCols["actions"] && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((loc) => (
                  <TableRow key={loc.id}>
                    {visibleCols["name"] && (
                      <TableCell className="font-medium text-foreground">
                        {loc.name}
                      </TableCell>
                    )}
                    {visibleCols["code"] && (
                      <TableCell className="font-mono text-xs font-semibold">{loc.code}</TableCell>
                    )}
                    {visibleCols["warehouse"] && (
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{loc.warehouse?.name || "Warehouse"}</span>
                        </div>
                      </TableCell>
                    )}
                    {visibleCols["hierarchy"] && (
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                          {loc.aisle ? (
                            <Badge variant="outline" className="bg-muted/50 font-normal">Aisle {loc.aisle}</Badge>
                          ) : null}
                          {loc.rack ? (
                            <Badge variant="outline" className="bg-muted/50 font-normal">Rack {loc.rack}</Badge>
                          ) : null}
                          {loc.shelf ? (
                            <Badge variant="outline" className="bg-muted/50 font-normal">Shelf {loc.shelf}</Badge>
                          ) : null}
                          {loc.bin ? (
                            <Badge variant="outline" className="border-brand/40 bg-brand/10 text-brand font-semibold">Bin {loc.bin}</Badge>
                          ) : null}
                          {!loc.aisle && !loc.rack && !loc.shelf && !loc.bin && (
                            <span className="text-muted-foreground text-xs font-sans">General Storage Area</span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {visibleCols["isDefault"] && (
                      <TableCell>
                        {loc.isDefault ? (
                          <Badge variant="outline" className="border-brand/40 bg-brand/10 text-brand font-medium">
                            Default Receiving Bay
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard Storage</span>
                        )}
                      </TableCell>
                    )}
                    {visibleCols["status"] && (
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            loc.status === "ACTIVE"
                              ? "border-success/40 bg-success/10 text-success"
                              : "border-muted bg-muted text-muted-foreground"
                          }
                        >
                          {loc.status === "ACTIVE" ? "Active" : "Inactive"}
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
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => handleOpenEdit(loc)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Location
                              </DropdownMenuItem>
                            )}
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => handleToggleStatus(loc)}>
                                <Power className="mr-2 h-4 w-4" />
                                {loc.status === "ACTIVE" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(loc)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Location
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

      {/* Create / Edit Location Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Storage Location" : "Create Storage Location"}</DialogTitle>
            <DialogDescription>
              Assign location code and physical hierarchy position (Aisle, Rack, Shelf, Bin).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="grid gap-4 py-2">
            {errorMsg && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="loc-wh">Parent Warehouse *</Label>
              <Select value={formWarehouseId} onValueChange={setFormWarehouseId}>
                <SelectTrigger id="loc-wh">
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehousesData?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="loc-name">Location Name *</Label>
                <Input
                  id="loc-name"
                  placeholder="e.g. Receiving Dock 1 / Bin A-01"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="loc-code">Location Code *</Label>
                <Input
                  id="loc-code"
                  placeholder="e.g. LOC-A1-R3-B12"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Hierarchy Section */}
            <div className="rounded-lg border border-border bg-muted/30 p-3.5">
              <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-brand" />
                Physical Structural Hierarchy Placement
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="loc-aisle" className="text-[11px]">Aisle</Label>
                  <Input
                    id="loc-aisle"
                    placeholder="e.g. A"
                    value={formAisle}
                    onChange={(e) => setFormAisle(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="loc-rack" className="text-[11px]">Rack</Label>
                  <Input
                    id="loc-rack"
                    placeholder="e.g. 03"
                    value={formRack}
                    onChange={(e) => setFormRack(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="loc-shelf" className="text-[11px]">Shelf</Label>
                  <Input
                    id="loc-shelf"
                    placeholder="e.g. 02"
                    value={formShelf}
                    onChange={(e) => setFormShelf(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="loc-bin" className="text-[11px]">Bin</Label>
                  <Input
                    id="loc-bin"
                    placeholder="e.g. B-12"
                    value={formBin}
                    onChange={(e) => setFormBin(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="loc-status">Status</Label>
                <Select value={formStatus} onValueChange={(val) => setFormStatus(val as any)}>
                  <SelectTrigger id="loc-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="loc-default"
                  checked={formIsDefault}
                  onCheckedChange={(val) => setFormIsDefault(Boolean(val))}
                />
                <Label htmlFor="loc-default" className="text-xs font-normal cursor-pointer">
                  Default Receiving Bay
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingLocation ? "Save Changes" : "Create Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}


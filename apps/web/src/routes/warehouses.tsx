import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useWarehouses, useCreateWarehouse } from "@/hooks/queries/useWarehouses";
import { useBranches } from "@/hooks/queries/useBranches";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Warehouse" },
  { key: "code", header: "Code" },
  { key: "branch", header: "Assigned Branch" },
  { key: "city", header: "City" },
  { key: "locations", header: "Active Locations" },
  { key: "isDefault", header: "Default Warehouse" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

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
  const { data: warehousesData } = useWarehouses();
  const createWarehouseMutation = useCreateWarehouse();
  const { data: branchesData } = useBranches();

  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State for Warehouse
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [branchId, setBranchId] = useState<string>("NONE");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setCode("");
    setBranchId("NONE");
    setCity("");
    setAddress("");
    setIsDefault(false);
    setStatus("ACTIVE");
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Warehouse Name is required.");
      return;
    }

    if (!code.trim()) {
      setFormError("Warehouse Code is required.");
      return;
    }

    try {
      await createWarehouseMutation.mutateAsync({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        branchId: branchId !== "NONE" ? branchId : null,
        city: city.trim() || null,
        address: address.trim() || null,
        isDefault,
        status,
      });
      toast.success(`Warehouse "${name.trim()}" created successfully!`);
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      const msg = err?.message || "Failed to create warehouse.";
      setFormError(msg);
      toast.error(msg);
    }
  };

  const rows: ListRow[] = warehousesData
    ? warehousesData.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        branch: w.branch ? `${w.branch.name} (${w.branch.city})` : "Central / Unassigned",
        city: w.city || "N/A",
        locations: String(w._count?.locations || 0),
        isDefault: w.isDefault ? "Primary Facility" : "Standard Warehouse",
        status: w.status === "ACTIVE" ? "Active" : "Inactive",
      }))
    : [];

  const stats = [
    { label: "Total Warehouses", value: String(warehousesData?.length || 0) },
    {
      label: "Active Depots",
      value: String(warehousesData?.filter((w) => w.status === "ACTIVE").length || 0),
    },
    {
      label: "Branch Assigned",
      value: String(warehousesData?.filter((w) => w.branchId).length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Inventory"
        actionLabel="New warehouse"
        onAction={handleOpenAdd}
        stats={stats}
        columns={columns}
        rows={rows}
      />

      {/* Create Warehouse Dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[95vw] sm:max-w-[550px] p-0 flex flex-col overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-4 border-b shrink-0 text-left">
            <DialogTitle>Add New Warehouse</DialogTitle>
            <DialogDescription>
              Register a physical facility, depot, or regional distribution center.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs rounded border border-destructive/40 bg-destructive/10 text-destructive font-medium">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name">
                    Warehouse Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Central Distribution Hub"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="code">
                    Warehouse Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. WH-BLR-01"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val: "ACTIVE" | "INACTIVE") => setStatus(val)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="branch">Assigned Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="Select branch (Optional)" />
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

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 42, Peenya Industrial Area Phase 3"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                  <Checkbox
                    id="isDefault"
                    checked={isDefault}
                    onCheckedChange={(val) => setIsDefault(Boolean(val))}
                  />
                  <Label htmlFor="isDefault" className="text-xs font-normal cursor-pointer">
                    Set as Default Primary Facility for Organization
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 sm:px-6 border-t bg-popover shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWarehouseMutation.isPending || !name.trim() || !code.trim()}
              >
                {createWarehouseMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createWarehouseMutation.isPending ? "Saving..." : "Save Warehouse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

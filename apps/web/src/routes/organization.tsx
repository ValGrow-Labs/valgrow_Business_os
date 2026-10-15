import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useOrganizations, useCreateOrganization } from "@/hooks/queries/useOrganizations";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { setActiveOrgId } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Store,
  Warehouse,
  CheckCircle2,
  Loader2,
  Info,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { CreatedOrganizationResult } from "@/hooks/queries/useOrganizations";
import { CurrencySelect } from "@/components/ui/currency-select";
import { formatCurrencyLabel } from "@/lib/currencies";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Setting" },
  { key: "value", header: "Value" },
  { key: "scope", header: "Scope" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Organization Settings";
const description =
  "Workspace identity, localisation and structure defaults for the active organization.";

export const Route = createFileRoute("/organization")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { data: userMe } = useCurrentUser();
  const { data: orgsData, refetch: refetchOrgs } = useOrganizations();
  const createOrgMutation = useCreateOrganization();

  const [showModal, setShowModal] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreatedOrganizationResult | null>(null);

  // Section A: Organization
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("Bengaluru");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [fiscalYearStart, setFiscalYearStart] = useState("April");

  // Section B: First Branch
  const [createBranch, setCreateBranch] = useState(true);
  const [branchName, setBranchName] = useState("Head Office");
  const [branchCode, setBranchCode] = useState("HQ-01");
  const [branchCity, setBranchCity] = useState("Bengaluru");

  // Section C: First Warehouse
  const [createWarehouse, setCreateWarehouse] = useState(true);
  const [warehouseName, setWarehouseName] = useState("Main Warehouse");
  const [warehouseCode, setWarehouseCode] = useState("WH-01");
  const [associateWithBranch, setAssociateWithBranch] = useState(true);

  const [validationError, setValidationError] = useState<string | null>(null);

  const activeOrg = userMe?.activeOrganization;
  const currentOrgItem = orgsData?.find((o) => o.id === activeOrg?.id);

  const rows: ListRow[] = [
    {
      name: "Legal name",
      value: currentOrgItem?.legalName || activeOrg?.name || "ValGrow Holdings",
      scope: "Global",
      status: "Active",
    },
    {
      name: "Default currency",
      value: currentOrgItem?.currency ? formatCurrencyLabel(currentOrgItem.currency) : "INR",
      scope: "Global",
      status: "Active",
    },
    {
      name: "Fiscal year start",
      value: (currentOrgItem as any)?.fiscalYearStart || "April",
      scope: "Global",
      status: "Active",
    },
    {
      name: "Time zone",
      value: currentOrgItem?.timezone || "Asia/Kolkata",
      scope: "Global",
      status: "Active",
    },
  ];

  const stats = [
    {
      label: "Organizations",
      value: String(orgsData?.length || 1),
      hint: "Accessible workspaces",
    },
    {
      label: "Branches",
      value: "4",
      hint: "Across operational cities",
    },
    {
      label: "Members",
      value: "128",
      hint: "Seats in use",
    },
    {
      label: "Plan",
      value: currentOrgItem?.plan || activeOrg?.plan || "Starter",
      hint: "Workspace tier",
    },
  ];

  const resetForm = () => {
    setName("");
    setLegalName("");
    setCurrency("INR");
    setCountry("India");
    setCity("Bengaluru");
    setTimezone("Asia/Kolkata");
    setFiscalYearStart("April");

    setCreateBranch(true);
    setBranchName("Head Office");
    setBranchCode("HQ-01");
    setBranchCity("Bengaluru");

    setCreateWarehouse(true);
    setWarehouseName("Main Warehouse");
    setWarehouseCode("WH-01");
    setAssociateWithBranch(true);

    setValidationError(null);
    setCreatedResult(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError("Organization name is required.");
      return;
    }

    // Check duplicate organization name locally
    const duplicate = orgsData?.some(
      (o) => o.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicate) {
      setValidationError("An organization with this name already exists in your account.");
      return;
    }

    // Validate Branch if enabled
    if (createBranch) {
      if (!branchName.trim()) {
        setValidationError("Branch name is required when creating a branch.");
        return;
      }
    }

    // Validate Warehouse if enabled
    if (createWarehouse) {
      if (!warehouseName.trim()) {
        setValidationError("Warehouse name is required when creating a warehouse.");
        return;
      }
      if (!warehouseCode.trim()) {
        setValidationError("Warehouse code is required when creating a warehouse.");
        return;
      }
      if (associateWithBranch && !createBranch) {
        setValidationError("Cannot associate warehouse with a branch when branch creation is disabled.");
        return;
      }
    }

    try {
      setValidationError(null);
      const res = await createOrgMutation.mutateAsync({
        name: trimmedName,
        legalName: legalName.trim() || undefined,
        currency,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        timezone,
        fiscalYearStart,
        createBranch,
        branch: createBranch
          ? {
              name: branchName.trim(),
              code: branchCode.trim() || undefined,
              city: branchCity.trim() || undefined,
            }
          : undefined,
        createWarehouse,
        warehouse: createWarehouse
          ? {
              name: warehouseName.trim(),
              code: warehouseCode.trim(),
              associateWithBranch,
            }
          : undefined,
      });

      setCreatedResult(res);
      toast.success(`Organization "${trimmedName}" setup completed successfully!`);
      refetchOrgs();
    } catch (err: any) {
      const errMsg =
        err?.data?.message || err?.message || "Failed to create organization";
      const displayMsg = Array.isArray(errMsg) ? errMsg.join(", ") : errMsg;
      setValidationError(displayMsg);
      toast.error(displayMsg);
    }
  };

  const handleSwitchOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    window.location.reload();
  };

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Organization"
        actionLabel="New organization"
        onAction={handleOpenModal}
        stats={stats}
        columns={columns}
        rows={rows}
      >
        {orgsData && orgsData.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Your Organizations
                </h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {orgsData.length} Workspace{orgsData.length === 1 ? "" : "s"}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {orgsData.map((org) => {
                const isActive = org.id === activeOrg?.id;
                return (
                  <div
                    key={org.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      isActive
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/60 bg-background hover:bg-muted/30"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {org.name}
                        </span>
                        {isActive && (
                          <Badge variant="success" className="text-[10px] py-0 px-1.5">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Role: {org.role}</span>
                        <span>•</span>
                        <span>{formatCurrencyLabel(org.currency)}</span>
                        <span>•</span>
                        <span>{org.plan}</span>
                      </div>
                    </div>
                    {!isActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSwitchOrg(org.id)}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground shrink-0"
                      >
                        Switch
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ListPage>

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {createdResult ? (
            /* Post-Creation Success Summary & Switch Action */
            <div className="space-y-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    Setup Completed Successfully!
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Your new organization and its initial structure have been configured.
                  </DialogDescription>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {createdResult.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Currency: {formatCurrencyLabel(createdResult.currency)} • Country: {createdResult.country || "India"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                    Created
                  </Badge>
                </div>

                <div className="border-t border-border/50 pt-2.5 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {createdResult.branch ? createdResult.branch.name : "No initial branch"}
                      </p>
                      {createdResult.branch && (
                        <p className="text-[11px] text-muted-foreground">
                          Code: {createdResult.branch.code || "HQ-01"} • City: {createdResult.branch.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {createdResult.branch ? "Branch Ready" : "Skipped"}
                  </Badge>
                </div>

                <div className="border-t border-border/50 pt-2.5 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {createdResult.warehouse ? createdResult.warehouse.name : "No initial warehouse"}
                      </p>
                      {createdResult.warehouse && (
                        <p className="text-[11px] text-muted-foreground">
                          Code: {createdResult.warehouse.code} • Linked to Branch: {createdResult.warehouse.branchId ? "Yes" : "No"}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {createdResult.warehouse ? "Warehouse Ready" : "Skipped"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
                <p>
                  Would you like to switch to <strong className="text-foreground">{createdResult.name}</strong> now to begin managing branches, inventory, or opening POS registers?
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Stay in Current Workspace
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSwitchOrg(createdResult.id)}
                  className="gap-1.5"
                >
                  Switch to this Organization
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* 3-Section Setup Form */
            <>
              <DialogHeader>
                <DialogTitle>New Organization Setup</DialogTitle>
                <DialogDescription>
                  Configure your workspace, default branch, and initial warehouse all in one step.
                </DialogDescription>
              </DialogHeader>

              {/* Educational Structure Guide */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Info className="h-4 w-4 text-primary" />
                  <span>Workspace Structure Guide</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] leading-relaxed">
                  <div>
                    <span className="font-semibold text-foreground">🏢 Organization:</span> Your company or business workspace.
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">🏪 Branch:</span> A shop, office, or business location.
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">📦 Warehouse:</span> The place where products are stored.
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 py-2">
                {/* SECTION A — ORGANIZATION DETAILS */}
                <div className="rounded-lg border border-border/80 bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Section A — Organization Details
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label htmlFor="org-name">Organization Name *</Label>
                      <Input
                        id="org-name"
                        placeholder="e.g. Acme Innovations"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (validationError) setValidationError(null);
                        }}
                        className="mt-1"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <Label htmlFor="org-currency">Default Currency *</Label>
                      <CurrencySelect
                        id="org-currency"
                        value={currency}
                        onValueChange={setCurrency}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="org-country">Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger id="org-country" className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="UAE">United Arab Emirates</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="China">China</SelectItem>
                          <SelectItem value="Japan">Japan</SelectItem>
                          <SelectItem value="Singapore">Singapore</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="org-legal-name">Legal Name (Optional)</Label>
                      <Input
                        id="org-legal-name"
                        placeholder="e.g. Acme Innovations Pvt Ltd"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="org-city">Head Office City</Label>
                      <Input
                        id="org-city"
                        placeholder="e.g. Bengaluru"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION B — FIRST BRANCH */}
                <div className="rounded-lg border border-border/80 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-blue-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Section B — First Branch
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="create-branch-checkbox"
                        checked={createBranch}
                        onCheckedChange={(checked) => {
                          const val = Boolean(checked);
                          setCreateBranch(val);
                          if (!val) {
                            setAssociateWithBranch(false);
                          } else {
                            setAssociateWithBranch(true);
                          }
                        }}
                      />
                      <Label
                        htmlFor="create-branch-checkbox"
                        className="text-xs font-normal cursor-pointer select-none text-muted-foreground"
                      >
                        Create the first branch now
                      </Label>
                    </div>
                  </div>

                  {createBranch ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label htmlFor="branch-name">Branch Name *</Label>
                        <Input
                          id="branch-name"
                          placeholder="e.g. Head Office or Indiranagar Store"
                          value={branchName}
                          onChange={(e) => {
                            setBranchName(e.target.value);
                            if (validationError) setValidationError(null);
                          }}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="branch-code">Branch Code</Label>
                        <Input
                          id="branch-code"
                          placeholder="e.g. HQ-01"
                          value={branchCode}
                          onChange={(e) => setBranchCode(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="branch-city">City or Location</Label>
                        <Input
                          id="branch-city"
                          placeholder="e.g. Bengaluru"
                          value={branchCity}
                          onChange={(e) => setBranchCity(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-1">
                      No initial branch will be created. You can create branches later in Settings.
                    </p>
                  )}
                </div>

                {/* SECTION C — FIRST WAREHOUSE */}
                <div className="rounded-lg border border-border/80 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-amber-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Section C — First Warehouse
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="create-warehouse-checkbox"
                        checked={createWarehouse}
                        onCheckedChange={(checked) => setCreateWarehouse(Boolean(checked))}
                      />
                      <Label
                        htmlFor="create-warehouse-checkbox"
                        className="text-xs font-normal cursor-pointer select-none text-muted-foreground"
                      >
                        Create the first warehouse now
                      </Label>
                    </div>
                  </div>

                  {createWarehouse ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label htmlFor="warehouse-name">Warehouse Name *</Label>
                        <Input
                          id="warehouse-name"
                          placeholder="e.g. Central Warehouse"
                          value={warehouseName}
                          onChange={(e) => {
                            setWarehouseName(e.target.value);
                            if (validationError) setValidationError(null);
                          }}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="warehouse-code">Warehouse Code *</Label>
                        <Input
                          id="warehouse-code"
                          placeholder="e.g. WH-01"
                          value={warehouseCode}
                          onChange={(e) => {
                            setWarehouseCode(e.target.value);
                            if (validationError) setValidationError(null);
                          }}
                          className="mt-1"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 pt-1">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="associate-branch-checkbox"
                            checked={associateWithBranch && createBranch}
                            disabled={!createBranch}
                            onCheckedChange={(checked) => setAssociateWithBranch(Boolean(checked))}
                            className="mt-0.5"
                          />
                          <div className="space-y-0.5">
                            <Label
                              htmlFor="associate-branch-checkbox"
                              className={`text-xs cursor-pointer select-none ${
                                !createBranch ? "text-muted-foreground/50" : "text-foreground font-medium"
                              }`}
                            >
                              Associate with the first branch
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                              {createBranch
                                ? `Connects this warehouse directly to "${branchName || "First Branch"}" for unified inventory & POS management.`
                                : "Branch creation is disabled; this warehouse will be created as an independent storage facility."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-1">
                      No initial warehouse will be created. You can create warehouses later in Warehouse settings.
                    </p>
                  )}
                </div>

                {(validationError || createOrgMutation.isError) && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {validationError ||
                        (createOrgMutation.error as any)?.message ||
                        "Failed to create organization setup"}
                    </span>
                  </div>
                )}

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={createOrgMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOrgMutation.isPending}>
                    {createOrgMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up workspace…
                      </>
                    ) : (
                      "Create Organization"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

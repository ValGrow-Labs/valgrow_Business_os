import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/hooks/queries/useOrganizations";
import { formatCountryName } from "@/lib/countries";
import { formatCurrencyLabel } from "@/lib/currencies";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Warehouse,
  Users,
  Pencil,
  ArrowRightLeft,
  Loader2,
  Coins,
  Clock,
  FileText,
  AlertTriangle,
  GitBranch,
  Layers,
  CheckCircle2,
} from "lucide-react";

export interface OrganizationDetailDialogProps {
  orgId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (org: any) => void;
  onSwitch?: (orgId: string) => void;
  isCurrentActive?: boolean;
}

export function OrganizationDetailDialog({
  orgId,
  open,
  onOpenChange,
  onEdit,
  onSwitch,
  isCurrentActive = false,
}: OrganizationDetailDialogProps) {
  const {
    data: org,
    isLoading,
    isError,
    error,
  } = useOrganization(open && orgId ? orgId : null);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const isInactive = org?.status ? org.status !== "ACTIVE" : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="p-6 border-b border-border/80 bg-muted/20">
          <DialogHeader className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
                  {org?.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="h-full w-full object-contain rounded-xl"
                    />
                  ) : (
                    <Building2 className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                      {org?.name || (isLoading ? "Loading Organization..." : "Organization Details")}
                    </DialogTitle>
                    {isCurrentActive && (
                      <Badge variant="default" className="gap-1 text-[11px] py-0 px-2 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Active Workspace
                      </Badge>
                    )}
                    {org && (
                      <Badge
                        variant={isInactive ? "destructive" : "success"}
                        className="text-[11px] py-0 px-2 uppercase font-semibold tracking-wider"
                      >
                        {org.status}
                      </Badge>
                    )}
                    {org?.plan && (
                      <Badge variant="outline" className="text-[11px] py-0 px-2 font-normal">
                        {org.plan} Tier
                      </Badge>
                    )}
                  </div>
                  <DialogDescription className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                    <span>Slug: <span className="font-mono text-foreground/80">{org?.slug || "—"}</span></span>
                    {org?.legalName && (
                      <>
                        <span>•</span>
                        <span>Legal: <span className="text-foreground/80">{org.legalName}</span></span>
                      </>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Inactive / Non-active Banner */}
            {isInactive && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium">Organization is {org?.status}</p>
                  <p className="mt-0.5 text-amber-800/80 dark:text-amber-300/80">
                    This organization is currently not active ({org?.status}). Viewing is available in read-only mode for authorized members.
                  </p>
                </div>
              </div>
            )}
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 py-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-36 rounded-lg" />
              <Skeleton className="h-36 rounded-lg" />
            </div>
          ) : isError || !org ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="font-medium">Failed to load organization details</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(error as any)?.data?.message || (error as any)?.message || "You may not have permission to view this organization."}
              </p>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>Members</span>
                  </div>
                  <p className="mt-1.5 text-lg font-bold text-foreground">
                    {org.memberCount ?? 1}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Assigned seats</p>
                </div>

                <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GitBranch className="h-3.5 w-3.5 text-primary" />
                    <span>Branches</span>
                  </div>
                  <p className="mt-1.5 text-lg font-bold text-foreground">
                    {org.branchCount ?? 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Operating locations</p>
                </div>

                <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Warehouse className="h-3.5 w-3.5 text-primary" />
                    <span>Warehouses</span>
                  </div>
                  <p className="mt-1.5 text-lg font-bold text-foreground">
                    {org.warehouseCount ?? 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Inventory depots</p>
                </div>

                <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Coins className="h-3.5 w-3.5 text-primary" />
                    <span>Currency</span>
                  </div>
                  <p className="mt-1.5 text-lg font-bold text-foreground">
                    {org.currency}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrencyLabel(org.currency)}</p>
                </div>
              </div>

              {/* Business Information Card */}
              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Business Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Legal Business Name</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {org.legalName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Tax ID / GSTIN</span>
                    <span className="font-medium text-foreground mt-0.5 block font-mono">
                      {org.taxId || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Registration / CIN</span>
                    <span className="font-medium text-foreground mt-0.5 block font-mono">
                      {org.registrationNumber || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Business Email
                    </span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {org.email || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {org.phone || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Website
                    </span>
                    {org.website ? (
                      <a
                        href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline mt-0.5 block truncate"
                      >
                        {org.website}
                      </a>
                    ) : (
                      <span className="font-medium text-foreground mt-0.5 block">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Address & Operations Card */}
              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Address & Operations</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Operating Country</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {org.country ? formatCountryName(org.country) : "India"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Primary City</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {org.primaryCity || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Primary Branch</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {org.primaryBranchName || "—"}
                    </span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-muted-foreground block text-[11px]">Registered Address</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {org.primaryAddress || "—"}
                    </span>
                  </div>
                </div>

                {/* Branches Preview */}
                {org.branches && org.branches.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Configured Branches ({org.branches.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {org.branches.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-muted/20 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-medium text-foreground truncate block">
                              {b.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {b.city} {b.code ? `• ${b.code}` : ""}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {b.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial & System Configuration */}
              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
                  <Coins className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Financial & System Configuration</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Base Currency</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {formatCurrencyLabel(org.currency)} ({org.currency})
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Timezone
                    </span>
                    <span className="font-medium text-foreground mt-0.5 block font-mono text-[11px]">
                      {org.timezone || "Asia/Kolkata"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Fiscal Year Start
                    </span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {org.fiscalYearStart || "April"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Valuation Method
                    </span>
                    <Badge variant="outline" className="mt-1 text-[11px] font-mono">
                      {org.valuationMethod || "FIFO"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Membership & Audit Information */}
              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
                <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Membership & Audit Context</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Your Role</span>
                    <Badge variant="outline" className="mt-1 font-semibold text-[11px]">
                      {org.role || "Member"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Membership Status</span>
                    <Badge
                      variant={org.membershipStatus === "ACTIVE" ? "success" : "secondary"}
                      className="mt-1 text-[11px]"
                    >
                      {org.membershipStatus || "Active"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Joined On</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {formatDate(org.joinedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Organization Created</span>
                    <span className="font-medium text-foreground mt-0.5 block">
                      {formatDateTime(org.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] text-muted-foreground">
            {org?.id && <span>ID: <code className="font-mono text-[10px] text-foreground/70">{org.id}</code></span>}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>

            {onEdit && org && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(org)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Organization
              </Button>
            )}

            {onSwitch && org && !isCurrentActive && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onSwitch(org.id)}
                className="gap-1.5"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Switch to Workspace
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

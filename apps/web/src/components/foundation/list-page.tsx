import type { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { DataTable, type Column } from "@/components/foundation/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type ListRow = Record<string, string>;

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "Active" || value === "Enabled" || value === "Success"
      ? "border-success/40 bg-success/10 text-success"
      : value === "Pending" || value === "Draft"
        ? "border-warning/40 bg-warning/10 text-warning"
        : value === "Failed" || value === "Revoked"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-secondary text-secondary-foreground";
  return (
    <Badge variant="outline" className={tone}>
      {value}
    </Badge>
  );
}

export function ListPage({
  title,
  description,
  eyebrow,
  actionLabel = "New record",
  stats = [],
  columns,
  rows,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  actionLabel?: string;
  stats?: { label: string; value: string; hint?: string }[];
  columns: Column<ListRow>[];
  rows: ListRow[];
  children?: ReactNode;
}) {
  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        {...(eyebrow ? { eyebrow } : {})}
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {actionLabel}
            </Button>
          </>
        }
      />

      {stats.length > 0 ? (
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
      ) : null}

      {children}

      <DataTable
        columns={columns}
        rows={rows}
        toolbar={
          <>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Filter records…" className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Columns
              </Button>
              <Button variant="outline" size="sm">
                Filters
              </Button>
            </div>
          </>
        }
      />
    </AppShell>
  );
}

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Download, ListFilter, Plus, Search, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { DataTable, type Column } from "@/components/foundation/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { PageGuideId } from "@/lib/onboarding-content";

export type ListRow = Record<string, string>;

const SUCCESS = /^(active|enabled|success|paid|completed|complete|delivered|confirmed|approved|received|posted|open|won|closed won)$/;
const WARNING = /^(pending|draft|processing|in progress|partial|partially.*|submitted|awaiting.*|on hold|sent)$/;
const DANGER = /^(failed|revoked|cancelled|canceled|overdue|rejected|void|voided|lost|closed lost|inactive|expired|blocked)$/;

export function statusVariant(value: string): NonNullable<BadgeProps["variant"]> {
  const v = value.trim().toLowerCase().replace(/_/g, " ");
  if (SUCCESS.test(v)) return "success";
  if (WARNING.test(v)) return "warning";
  if (DANGER.test(v)) return "destructive-soft";
  return "neutral";
}

export function StatusBadge({ value }: { value: string }) {
  const variant = statusVariant(value);
  return (
    <Badge variant={variant}>
      <span
        className={
          variant === "success"
            ? "h-1.5 w-1.5 rounded-full bg-success"
            : variant === "warning"
              ? "h-1.5 w-1.5 rounded-full bg-warning"
              : variant === "destructive-soft"
                ? "h-1.5 w-1.5 rounded-full bg-destructive"
                : "h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
        }
      />
      {value}
    </Badge>
  );
}

/** Name cell with an initial avatar — for people, customers and products. */
export function NameCell({ value, sub }: { value: string; sub?: string }) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-muted-foreground">
        {initials || "—"}
      </span>
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{value}</div>
        {sub ? <div className="truncate text-xs text-muted-foreground">{sub}</div> : null}
      </div>
    </div>
  );
}

/** Monospace identifier cell (SKU, codes, document numbers). */
export function CodeCell({ value }: { value: string }) {
  return <span className="font-mono text-xs text-muted-foreground">{value || "—"}</span>;
}

/** Right-aligned tabular number; dims zero values. */
export function NumberCell({ value, tone }: { value: string; tone?: "danger" | "warning" }) {
  const numeric = Number(value.replace(/[^\d.-]/g, ""));
  const zero = value.trim() !== "" && Number.isFinite(numeric) && numeric === 0;
  return (
    <span
      className={
        tone === "danger"
          ? "tabular font-medium text-destructive"
          : tone === "warning"
            ? "tabular font-medium text-warning"
            : zero
              ? "tabular text-muted-foreground"
              : "tabular font-medium text-foreground"
      }
    >
      {value}
    </span>
  );
}

const STAT_COLS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

export interface ListPageProps {
  title: string;
  description: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  stats?: { label: string; value: string; hint?: string }[];
  columns: Column<ListRow>[];
  rows: ListRow[];
  children?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  guide?: PageGuideId;
  /** Optional controlled search query value. */
  searchValue?: string;
  /** Optional callback fired when the search query changes or clears. */
  onSearchChange?: (value: string) => void;
  /** Custom placeholder for the search input. Defaults to "Search records…". */
  searchPlaceholder?: string;
  /** Optional filter controls rendered inside the filter area. */
  filterContent?: ReactNode;
  /** Optional indicator whether any filter is actively applied. */
  hasActiveFilters?: boolean;
  /** Display mode for filters: "inline" (collapsible row) or "popover" (dropdown). Defaults to "inline". */
  filterMode?: "inline" | "popover";
  /** Whether the inline filter area is open by default. Defaults to false. */
  defaultFilterOpen?: boolean;
}

export function ListPage({
  title,
  description,
  eyebrow,
  actionLabel = "New record",
  onAction,
  onExport,
  isExporting = false,
  stats = [],
  columns,
  rows,
  children,
  isLoading = false,
  isError = false,
  onRetry,
  guide,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records…",
  filterContent,
  hasActiveFilters = false,
  filterMode = "inline",
  defaultFilterOpen = false,
}: ListPageProps) {
  // Support both controlled and uncontrolled search
  const isControlled = searchValue !== undefined;
  const [internalSearch, setInternalSearch] = useState("");
  const currentSearch = isControlled ? searchValue : internalSearch;

  const handleSearchChange = (value: string) => {
    if (!isControlled) {
      setInternalSearch(value);
    }
    onSearchChange?.(value);
  };

  const handleClearSearch = () => {
    handleSearchChange("");
  };

  const [isFilterOpen, setIsFilterOpen] = useState(defaultFilterOpen);

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        {...(eyebrow ? { eyebrow } : {})}
        {...(guide ? { guide } : {})}
        actions={
          <>
            <Button variant="outline" onClick={onExport} disabled={isExporting}>
              <Download />
              {isExporting ? "Exporting…" : "Export"}
            </Button>
            <Button onClick={onAction}>
              <Plus />
              {actionLabel}
            </Button>
          </>
        }
      />

      {stats.length > 0 ? (
        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className={
            STAT_COLS[stats.length]
              ? `grid gap-4 ${STAT_COLS[stats.length]}`
              : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          }
        >
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={staggerItem}>
              <StatCard
                label={s.label}
                value={s.value}
                {...(s.hint ? { hint: s.hint } : {})}
                tone={i === 0 ? "brand" : "default"}
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>
      ) : null}

      {children}

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        {...(onRetry ? { onRetry } : {})}
        toolbar={
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              {/* Controlled / Uncontrolled Search Input with icon and clear action */}
              <div className="relative w-full sm:w-72">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  value={currentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && currentSearch) {
                      e.preventDefault();
                      handleClearSearch();
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "h-8 pl-8 text-[13px] bg-background",
                    currentSearch ? "pr-8" : "pr-2.5",
                  )}
                  aria-label={searchPlaceholder}
                />
                {currentSearch ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>

              {/* Action Toolbar */}
              {filterContent ? (
                <div className="flex items-center gap-1.5">
                  {filterMode === "popover" ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={hasActiveFilters ? "secondary" : "outline"}
                          size="sm"
                          className="h-8 gap-1.5 text-[13px]"
                          aria-label="Filters"
                        >
                          <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                          Filters
                          {hasActiveFilters && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80 sm:w-96 p-4">
                        {filterContent}
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Button
                      variant={isFilterOpen || hasActiveFilters ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setIsFilterOpen((prev) => !prev)}
                      aria-expanded={isFilterOpen}
                      className="h-8 gap-1.5 text-[13px]"
                      aria-label="Toggle filters"
                    >
                      <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                      Filters
                      {hasActiveFilters && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Functional Collapsible Filter Area */}
            {filterContent && filterMode !== "popover" && isFilterOpen ? (
              <div
                className="w-full border-t border-border/60 pt-3 flex flex-wrap items-center gap-3"
                role="region"
                aria-label="Filter controls"
              >
                {filterContent}
              </div>
            ) : null}
          </div>
        }
      />
    </AppShell>
  );
}

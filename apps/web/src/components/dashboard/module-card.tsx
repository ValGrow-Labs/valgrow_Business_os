import { Fragment, useId } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUp, Clock, MoreVertical, type LucideIcon } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ModuleCard as ModuleCardType, ModuleHealth } from "@/lib/dashboard-data";

const healthStyles: Record<ModuleHealth, { label: string; dot: string; badge: string }> = {
  healthy: {
    label: "Healthy",
    dot: "bg-success",
    badge: "border-success/25 bg-success/10 text-success",
  },
  running: {
    label: "Running",
    dot: "bg-primary",
    badge: "border-primary/25 bg-primary/10 text-primary",
  },
  review: {
    label: "Needs Review",
    dot: "bg-warning",
    badge: "border-warning/25 bg-warning/10 text-warning",
  },
  warning: {
    label: "Warning",
    dot: "bg-orange-500",
    badge: "border-orange-500/25 bg-orange-500/10 text-orange-500",
  },
  offline: {
    label: "Offline",
    dot: "bg-muted-foreground/50",
    badge: "border-border bg-muted/40 text-muted-foreground",
  },
};

function HealthBadge({ health }: { health: ModuleHealth }) {
  const s = healthStyles[health];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap",
        s.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function TrendPill({ delta }: { delta: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-success/12 px-1.5 py-0.5 text-[10px] font-bold text-success">
      <ArrowUp className="h-2.5 w-2.5" /> {delta}
    </span>
  );
}

function KpiBlock({
  value,
  label,
  trend,
}: {
  value: string;
  label: string;
  trend?: { delta: string } | undefined;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-1.5">
        <p className="text-xl font-bold leading-none tracking-tight">{value}</p>
        {trend ? <TrendPill delta={trend.delta} /> : null}
      </div>
      <p
        className="mt-1 truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70"
        title={label}
      >
        {label}
      </p>
    </div>
  );
}

function Sparkline({ data, health }: { data: number[]; health: ModuleHealth }) {
  const id = useId();
  const chartData = data.map((v, i) => ({ i, v }));
  const stroke = health === "review" ? "var(--warning)" : "var(--primary)";

  return (
    <div className="h-8 w-16 transition-[filter] duration-[250ms] group-hover:brightness-125">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniBarChart({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className="h-8 w-16 transition-[filter] duration-[250ms] group-hover:brightness-125">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }} barGap={1.5}>
          <Bar dataKey="v" radius={[2, 2, 0, 0]} fill="var(--primary)" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniDonut({
  segments,
}: {
  segments: Array<{ label: string; value: number; colorVar: string }>;
}) {
  return (
    <div className="h-9 w-9 shrink-0 transition-transform duration-[250ms] group-hover:scale-110">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="label"
            innerRadius={12}
            outerRadius={18}
            paddingAngle={3}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {segments.map((s) => (
              <Cell key={s.label} fill={s.colorVar} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const avatarPalette = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
];

function AvatarStack({
  people,
  extra,
}: {
  people: Array<{ name: string; initials: string }>;
  extra: number;
}) {
  return (
    <div className="flex items-center">
      {people.slice(0, 3).map((p, i) => (
        <Avatar key={p.name} className={cn("h-6 w-6 border-2 border-surface", i > 0 && "-ml-2")}>
          <AvatarFallback
            className={cn("text-[9px] font-semibold", avatarPalette[i % avatarPalette.length])}
          >
            {p.initials}
          </AvatarFallback>
        </Avatar>
      ))}
      <span className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-accent text-[9px] font-semibold text-accent-foreground">
        +{extra}
      </span>
    </div>
  );
}

function WorkflowPipeline({
  steps,
}: {
  steps: Array<{ icon: LucideIcon; state: "done" | "active" | "pending" }>;
}) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <Fragment key={i}>
          {i > 0 ? <span className="h-px w-1 border-t border-dashed border-border" /> : null}
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-transform duration-[250ms] group-hover:scale-110",
              step.state === "active" &&
                "border-success bg-success text-white shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_18%,transparent)]",
              step.state === "done" && "border-border bg-surface-2 text-muted-foreground",
              step.state === "pending" &&
                "border-border/60 bg-surface-2/50 text-muted-foreground/40",
            )}
          >
            <step.icon className="h-2.5 w-2.5" />
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function ModuleMiddleRow({ card }: { card: ModuleCardType }) {
  const { primaryValue, primaryLabel, secondaryValue, secondaryLabel, trend, visual, health } =
    card;
  const showInlineTrend = Boolean(trend) && !secondaryValue;

  return (
    <div className="relative flex flex-1 items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-end gap-3">
        <KpiBlock
          value={primaryValue}
          label={primaryLabel}
          trend={showInlineTrend ? trend : undefined}
        />
        {secondaryValue ? <KpiBlock value={secondaryValue} label={secondaryLabel ?? ""} /> : null}
      </div>

      <div className="flex shrink-0 items-center justify-end">
        {visual.kind === "sparkline" ? <Sparkline data={visual.data} health={health} /> : null}
        {visual.kind === "bar" ? <MiniBarChart data={visual.data} /> : null}
        {visual.kind === "donut" ? <MiniDonut segments={visual.segments} /> : null}
        {visual.kind === "avatars" ? (
          <AvatarStack people={visual.people} extra={visual.extra} />
        ) : null}
        {visual.kind === "workflow" ? <WorkflowPipeline steps={visual.steps} /> : null}
      </div>
    </div>
  );
}

export function ModuleCard(card: ModuleCardType) {
  const { title, icon: Icon, health, updated, cta, url } = card;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col gap-3 overflow-hidden rounded-[20px] border border-border/70 bg-surface/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-[250ms]",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_0_1px_var(--primary),0_24px_50px_-26px_var(--brand)]",
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-[250ms] group-hover:opacity-100" />

      <div className="relative flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary backdrop-blur-sm transition-transform duration-[250ms] group-hover:scale-110">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <h3 className="min-w-0 truncate text-sm font-semibold" title={title}>
            {title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <HealthBadge health={health} />
          <button
            type="button"
            aria-label="Module actions"
            className="shrink-0 rounded-lg p-0.5 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ModuleMiddleRow card={card} />

      <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" /> {updated}
        </span>
        <Link
          to={url}
          className="flex items-center gap-1 rounded-lg border border-primary/30 px-2.5 py-1 text-[11px] font-semibold text-primary transition-all duration-[250ms] group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_8px_20px_-8px_var(--brand)]"
        >
          {cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

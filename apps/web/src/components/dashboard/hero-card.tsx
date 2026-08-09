import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Sparkles, TrendingUp, UserPlus, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradientBlur } from "@/components/ui/gradient-blur";

// ValGrow brand palette — purple, violet, indigo (RGB tuples for the canvas).
const BRAND_GLOW_COLORS: Array<[number, number, number]> = [
  [139, 92, 246], // #8B5CF6 purple
  [168, 85, 247], // #A855F7 violet
  [99, 102, 241], // #6366F1 indigo
];

function brandGlowColor(): [number, number, number] {
  return BRAND_GLOW_COLORS[Math.floor(Math.random() * BRAND_GLOW_COLORS.length)]!;
}

const revenueStats = [
  { label: "Net revenue", value: "$1.24M", delta: "+12.4%", icon: Wallet },
  { label: "Active projects", value: "24", delta: "+3 this week", icon: TrendingUp },
  { label: "Team headcount", value: "312", delta: "+8 this month", icon: UserPlus },
];

const orgStatus = [
  { label: "Head Office", state: "Operational" },
  { label: "North Hub", state: "Operational" },
  { label: "West Hub", state: "Reviewing" },
];

export function HeroCard() {
  return (
    <div className="panel relative overflow-hidden p-6 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span
          className="animate-hero-drift-a absolute right-[-40px] top-1/2 h-44 w-44 rounded-full opacity-[0.15] blur-[70px]"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #A855F7 0%, #8B5CF6 45%, #6366F1 78%, transparent 100%)",
          }}
        />
        <span
          className="animate-hero-drift-b absolute bottom-[-24px] right-[18%] h-32 w-32 rounded-full opacity-[0.08] blur-[60px]"
          style={{
            background: "radial-gradient(circle, #06B6D4 0%, #6366F1 55%, transparent 100%)",
          }}
        />
        <GradientBlur
          className="absolute inset-0 h-full w-full cursor-default blur-[24px]"
          radius={130}
          opacityDecay={0.055}
          spawnIntervalMs={55}
          minMoveDistance={6}
          colorGenerator={brandGlowColor}
        />
      </div>

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Business overview</Badge>
            <Badge variant="outline" className="gap-1 border-success/40 text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> All systems operational
            </Badge>
          </div>

          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            Good to see you, <span className="text-gradient-brand">Jaasir</span>. Here&apos;s how
            ValGrow is performing.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Revenue, headcount and operations across every branch — synced in real time and
            summarized by your AI copilot below.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {revenueStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-surface-2/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-semibold text-success">{s.delta}</span>
                </div>
                <p className="mt-3 text-xl font-bold">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm">
              <Link to="/users">
                <UserPlus className="mr-2 h-4 w-4" /> Invite a member
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/organization">
                <Building2 className="mr-2 h-4 w-4" /> Organization settings
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> AI insight
            </div>
            <p className="mt-2 text-sm text-foreground/90">
              Operating costs are down 6% quarter over quarter while headcount grew 8% — efficiency
              is trending in the right direction.
            </p>
            <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-primary">
              <Link to="/">
                Ask the AI copilot <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Organization status
            </p>
            <ul className="mt-3 space-y-2.5">
              {orgStatus.map((o) => (
                <li key={o.label} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/90">{o.label}</span>
                  <Badge
                    variant="outline"
                    className={
                      o.state === "Operational"
                        ? "border-success/40 text-success"
                        : "border-warning/40 text-warning"
                    }
                  >
                    {o.state}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

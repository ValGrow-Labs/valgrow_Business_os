import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, Settings2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { HeroCard } from "@/components/dashboard/hero-card";
import { ModuleCard } from "@/components/dashboard/module-card";
import { RightPanel } from "@/components/dashboard/right-panel";
import { moduleCards, moduleInsights } from "@/lib/dashboard-data";

const description =
  "ValGrow Business OS — a unified dashboard for organization, people, finance and operations.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Dashboard · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <AppShell rightPanel={<RightPanel />}>
      <HeroCard />

      <div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <LayoutGrid className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Modules</h2>
              <p className="text-sm text-muted-foreground">
                Everything running across your organization, at a glance.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <Settings2 className="mr-2 h-4 w-4" /> Customize modules
          </Button>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
          {moduleCards.map((m) => (
            <ModuleCard key={m.title} {...m} />
          ))}
        </div>

        <div className="relative mt-5 overflow-hidden rounded-[22px] border border-primary/25 bg-primary/8 p-5">
          <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-primary">AI Insight</p>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-3">
              {moduleInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-2">
                  <insight.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                  <div>
                    <p className="text-sm font-medium leading-snug">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              View all insights <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

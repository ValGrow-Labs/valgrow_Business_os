import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { GettingStarted } from "@/components/onboarding/getting-started";
import {
  AttentionCard,
  KpiGrid,
  OverviewGreeting,
  RecentSalesCard,
  RevenueChartCard,
} from "@/components/dashboard/overview";

const description =
  "ValGrow Business OS — a unified dashboard for organization, people, finance and operations.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Dashboard · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: DashboardOverview,
});

function DashboardOverview() {
  return (
    <AppShell>
      <OverviewGreeting />
      <GettingStarted />
      <KpiGrid />
      <div className="grid gap-6 xl:grid-cols-3">
        <RevenueChartCard className="xl:col-span-2" />
        <AttentionCard />
      </div>
      <RecentSalesCard />
    </AppShell>
  );
}

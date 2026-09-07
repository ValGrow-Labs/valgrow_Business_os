import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import {
  OverviewHeader,
  WelcomeHeroBanner,
  BusinessHubSection,
  FeatureCardsSection,
  HowItWorksSection,
} from "@/components/dashboard/overview-components";

const description =
  "ValGrow Business OS — a unified dashboard for organization, people, finance and operations.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Overview · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <AppShell>
      <div className="space-y-8 pb-10">
        <OverviewHeader />
        <WelcomeHeroBanner />
        <BusinessHubSection />
        <FeatureCardsSection />
        <HowItWorksSection />
      </div>
    </AppShell>
  );
}

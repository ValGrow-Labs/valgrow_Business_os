import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingProblemSolution } from "@/components/landing/landing-problem-solution";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingEcosystem } from "@/components/landing/landing-ecosystem";
import { LandingProductShowcase } from "@/components/landing/landing-product-showcase";
import { LandingUseCases } from "@/components/landing/landing-use-cases";
import { LandingWhyValgrow } from "@/components/landing/landing-why-valgrow";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { GetStartedDialog } from "@/components/landing/get-started-dialog";

const title = "ValGrow Business OS — Run Your Entire Business From One Platform";
const description =
  "Manage operations, inventory, sales, purchasing, customers, and business performance with one intelligent Business Operating System.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [getStartedOpen, setGetStartedOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-foreground">
      {/* Sticky Navigation */}
      <LandingNav onGetStartedClick={() => setGetStartedOpen(true)} />

      {/* Main Landing Sections */}
      <main className="flex-1">
        {/* Section 2: Hero */}
        <LandingHero onGetStartedClick={() => setGetStartedOpen(true)} />

        {/* Section 3: Problem and Solution */}
        <LandingProblemSolution />

        {/* Section 4: Core Features (The 8 Pillars) */}
        <LandingFeatures />

        {/* Section 5: Connected Business Ecosystem */}
        <LandingEcosystem />

        {/* Section 6: Interactive Product Demonstration Showcase */}
        <LandingProductShowcase />

        {/* Section 7: Built for Growing Businesses */}
        <LandingUseCases onGetStartedClick={() => setGetStartedOpen(true)} />

        {/* Section 8: Why ValGrow */}
        <LandingWhyValgrow />

        {/* Section 9: Closing CTA */}
        <LandingCta onGetStartedClick={() => setGetStartedOpen(true)} />
      </main>

      {/* Section 10: Footer */}
      <LandingFooter onGetStartedClick={() => setGetStartedOpen(true)} />

      {/* Interactive Get Started / Access Modal */}
      <GetStartedDialog
        open={getStartedOpen}
        onOpenChange={setGetStartedOpen}
      />
    </div>
  );
}

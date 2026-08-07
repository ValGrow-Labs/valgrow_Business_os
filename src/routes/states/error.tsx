import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { ErrorState } from "@/components/foundation/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

const description = "Error and failure presentation used consistently across modules.";

export const Route = createFileRoute("/states/error")({
  head: () => ({
    meta: [
      { title: "Error States · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Error States · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: ErrorStatesPage,
});

function ErrorStatesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="States"
        title="Error States"
        description={description}
        actions={
          <Button asChild variant="outline">
            <Link to="/states/empty">Empty states</Link>
          </Button>
        }
      />
      <Section title="Inline alerts" description="For form and section level failures.">
        <div className="space-y-3">
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>A placeholder error message goes here.</AlertDescription>
          </Alert>
          <Alert>
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Partial data</AlertTitle>
            <AlertDescription>Some placeholder records could not be loaded.</AlertDescription>
          </Alert>
        </div>
      </Section>
      <Section title="Block error" description="For full panels and pages.">
        <ErrorState />
      </Section>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { CardSkeleton, LoadingSkeleton } from "@/components/foundation/states";
import { Button } from "@/components/ui/button";

const description = "Skeleton placeholders used while any module loads its data.";

export const Route = createFileRoute("/states/loading")({
  head: () => ({
    meta: [
      { title: "Loading States · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Loading States · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: LoadingStatesPage,
});

function LoadingStatesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="States"
        title="Loading States"
        description={description}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/states/empty">Empty states</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/states/error">Error states</Link>
            </Button>
          </>
        }
      />
      <Section title="Card skeletons" description="For stat and summary tiles.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Section>
      <Section title="List skeletons" description="For tables and record lists.">
        <LoadingSkeleton rows={5} />
      </Section>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { EmptyState } from "@/components/foundation/states";
import { Button } from "@/components/ui/button";

const description = "Reusable empty states for lists, folders and search results.";

export const Route = createFileRoute("/states/empty")({
  head: () => ({
    meta: [
      { title: "Empty States · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Empty States · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: EmptyStatesPage,
});

function EmptyStatesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="States"
        title="Empty States"
        description={description}
        actions={
          <Button asChild variant="outline">
            <Link to="/states/loading">Loading states</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="No records" description="Default variant.">
          <EmptyState action={<Button size="sm">Create record</Button>} />
        </Section>
        <Section title="No members" description="With custom icon.">
          <EmptyState
            title="No members in this team"
            description="Invite people to populate this placeholder team."
            icon={<Users className="h-5 w-5" />}
            action={
              <Button size="sm" variant="outline">
                Invite member
              </Button>
            }
          />
        </Section>
        <Section title="No files" description="File manager variant.">
          <EmptyState
            title="This folder is empty"
            description="Drop files into the uploader to see previews."
            icon={<FolderOpen className="h-5 w-5" />}
          />
        </Section>
        <Section title="No search results" description="Search variant.">
          <EmptyState
            title="No matches found"
            description="Try a different keyword or open the command palette."
          />
        </Section>
      </div>
    </AppShell>
  );
}

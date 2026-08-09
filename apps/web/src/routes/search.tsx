import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { searchTargets } from "@/lib/nav";

const description = "Search every foundation page, setting and shared component.";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Global Search · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Global Search · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: GlobalSearchPage,
});

function GlobalSearchPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Foundation"
        title="Global Search"
        description={description}
        actions={<Button variant="outline">Open command palette (⌘K)</Button>}
      />

      <Section title="Search" description="Results are navigation placeholders.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search pages, people, settings…" className="h-11 pl-10" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {searchTargets.map((t) => (
            <Link
              key={`${t.group}-${t.title}`}
              to={t.url}
              className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <t.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.url}</span>
              </span>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {t.group}
              </Badge>
            </Link>
          ))}
        </div>
      </Section>
    </AppShell>
  );
}

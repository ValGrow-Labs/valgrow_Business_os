import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Building2,
  Component,
  KeyRound,
  Layers,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section, StatCard } from "@/components/foundation/stat-card";
import { NotificationItem } from "@/components/foundation/notification-item";
import { EmptyState } from "@/components/foundation/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { navGroups, notifications } from "@/lib/nav";

const description =
  "Foundation UI for ValGrow Business OS — reusable layout, navigation and shared components for every future module.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Foundation Overview · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Foundation Overview · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: Overview,
});

const foundationGroups = navGroups.filter((g) => g.label !== "Business modules");
const comingSoon = navGroups.find((g) => g.label === "Business modules")!.items;

function Overview() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Foundation"
        title="ValGrow Business OS foundation"
        description={description}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/components">
                <Component className="mr-2 h-4 w-4" /> Component library
              </Link>
            </Button>
            <Button asChild>
              <Link to="/users">
                Manage access <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="gradient-brand pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl" />
        <div className="relative max-w-2xl space-y-3">
          <Badge variant="secondary">Foundation release · v0.1.0</Badge>
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            The <span className="text-gradient-brand">AI-first</span> shell every module plugs into.
          </h2>
          <p className="text-sm text-muted-foreground">
            Sidebar, top bar, breadcrumbs, global search, command palette, organization and branch
            switchers, notifications and shared UI primitives — all placeholder content, no business
            logic.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm">
              <Link to="/organization">Organization settings</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/states/loading">Loading, empty & error states</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Foundation pages" value="30" hint="Layouts, settings and states" icon={Layers} tone="brand" />
        <StatCard label="Shared components" value="38" hint="Shadcn-based primitives" icon={Component} />
        <StatCard label="Access primitives" value="Roles + 96 keys" hint="Ready for module wiring" icon={KeyRound} />
        <StatCard label="Workspace scopes" value="3 orgs · 4 branches" hint="Switchers in the top bar" icon={Building2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section
            title="Navigation map"
            description="Every foundation area available in the sidebar."
          >
            <Tabs defaultValue={foundationGroups[0]!.label}>
              <TabsList className="flex-wrap">
                {foundationGroups.map((g) => (
                  <TabsTrigger key={g.label} value={g.label}>
                    {g.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {foundationGroups.map((g) => (
                <TabsContent key={g.label} value={g.label} className="mt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {g.items.map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{item.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.url}
                          </span>
                        </span>
                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Section>
        </div>

        <div className="space-y-6">
          <Section
            title="Notifications"
            description="Latest workspace activity."
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link to="/notifications">
                  <Bell className="mr-2 h-4 w-4" /> All
                </Link>
              </Button>
            }
          >
            <div className="space-y-1">
              {notifications.map((n) => (
                <NotificationItem key={n.id} {...n} />
              ))}
            </div>
          </Section>

          <Section title="Coming soon" description="Business modules are not implemented yet.">
            <ul className="space-y-2">
              {comingSoon.map((m) => (
                <li
                  key={m.title}
                  className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2 text-sm opacity-70"
                >
                  <m.icon className="h-4 w-4" />
                  {m.title}
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Soon
                  </Badge>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <Section title="Team activity" description="No business data is wired into the foundation.">
        <EmptyState
          title="No module data yet"
          description="Once a business module ships, its widgets will render inside this reusable container."
          icon={<Users className="h-5 w-5" />}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/activity">View activity logs</Link>
            </Button>
          }
        />
      </Section>
    </AppShell>
  );
}

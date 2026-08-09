import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section, StatCard } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const description = "Session, device and policy placeholders for the workspace security surface.";

export const Route = createFileRoute("/settings/security")({
  head: () => ({
    meta: [
      { title: "Security Settings · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Security Settings · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: SecuritySettingsPage,
});

const policies = [
  ["Two-factor authentication", "Require a second factor for every member."],
  ["Single sign-on", "Delegate authentication to your identity provider."],
  ["IP allow list", "Restrict workspace access to approved networks."],
];

function SecuritySettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings"
        title="Security Settings"
        description={description}
        actions={<Button variant="outline">Download policy</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active sessions" value="12" hint="Across 8 devices" tone="brand" />
        <StatCard label="2FA coverage" value="86%" />
        <StatCard label="Open reviews" value="2" />
      </div>
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>No authentication logic</AlertTitle>
        <AlertDescription>
          This page demonstrates layout only — nothing is enforced.
        </AlertDescription>
      </Alert>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Policies" description="Toggle placeholders.">
          <div className="space-y-1">
            {policies.map(([title, sub], i) => (
              <div key={title} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <Switch defaultChecked={i === 0} />
              </div>
            ))}
          </div>
        </Section>
        <Section title="Sessions" description="Grouped by device type.">
          <Accordion type="single" collapsible>
            {["Desktop · Chrome", "Mobile · Safari", "Tablet · Edge"].map((d, i) => (
              <AccordionItem key={d} value={d}>
                <AccordionTrigger className="text-sm">
                  <span className="flex flex-1 items-center gap-2">
                    {d}
                    {i === 0 ? <Badge variant="secondary">This device</Badge> : null}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Placeholder location · Last active recently</p>
                  <Button size="sm" variant="outline">
                    Revoke session
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>
      </div>
    </AppShell>
  );
}

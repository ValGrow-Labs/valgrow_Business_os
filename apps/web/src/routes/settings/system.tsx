import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section, StatCard } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const description = "Workspace-wide system defaults every future module will read.";

export const Route = createFileRoute("/settings/system")({
  head: () => ({
    meta: [
      { title: "System Settings · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "System Settings · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: SystemSettingsPage,
});

const flags = [
  ["Maintenance mode", "Show a maintenance banner to all members."],
  ["Module sandbox", "Allow unreleased modules in this workspace."],
  ["Telemetry", "Share anonymous usage data."],
];

function SystemSettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings"
        title="System Settings"
        description={description}
        actions={<Button>Save settings</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Version" value="0.1.0" hint="Foundation UI" tone="brand" />
        <StatCard label="Environment" value="Preview" />
        <StatCard label="Region" value="ap-south" />
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Presentation only</AlertTitle>
        <AlertDescription>
          These controls are placeholders — no configuration is persisted.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Defaults" description="Applied to new branches and modules.">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="wsname">Workspace name</Label>
              <Input id="wsname" defaultValue="ValGrow Holdings" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Primary domain</Label>
              <Input id="domain" defaultValue="valgrow.example" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support">Support email</Label>
              <Input id="support" defaultValue="placeholder@example.com" />
            </div>
          </div>
        </Section>

        <Section title="Feature flags" description="Toggle foundation-level behaviour.">
          <div className="space-y-1">
            {flags.map(([title, sub], i) => (
              <div key={title} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <Switch defaultChecked={i === 2} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const description = "Layout density, sidebar behaviour and typography scale for the workspace.";

export const Route = createFileRoute("/settings/appearance")({
  head: () => ({
    meta: [
      { title: "Appearance Settings · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Appearance Settings · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: AppearanceSettingsPage,
});

function AppearanceSettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Settings"
        title="Appearance Settings"
        description={description}
        actions={<Button>Save appearance</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Density" description="Controls padding across shared components.">
          <RadioGroup defaultValue="comfortable" className="space-y-3">
            {[
              ["compact", "Compact"],
              ["comfortable", "Comfortable"],
              ["spacious", "Spacious"],
            ].map(([v, l]) => (
              <label
                key={v}
                className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <RadioGroupItem value={v!} id={v} />
                {l}
              </label>
            ))}
          </RadioGroup>
        </Section>
        <Section title="Layout" description="Sidebar and typography placeholders.">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Font scale</Label>
              <Slider defaultValue={[100]} min={80} max={130} step={5} />
            </div>
            {[
              ["Collapse sidebar by default", true],
              ["Sticky page header", false],
              ["Show footer", true],
            ].map(([title, on]) => (
              <div key={String(title)} className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{title}</p>
                <Switch defaultChecked={on === true} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

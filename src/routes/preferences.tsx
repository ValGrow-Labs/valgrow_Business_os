import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const description = "Language, density, notification and workflow preferences for your account.";

export const Route = createFileRoute("/preferences")({
  head: () => ({
    meta: [
      { title: "User Preferences · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "User Preferences · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: PreferencesPage,
});

const toggles = [
  ["Email notifications", "Receive a digest of workspace activity."],
  ["In-app notifications", "Show the notification badge in the top bar."],
  ["Keyboard shortcuts", "Enable the command palette shortcut (⌘K)."],
  ["Compact tables", "Reduce row height in data grids."],
];

function PreferencesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Account"
        title="User Preferences"
        description={description}
        actions={<Button>Save preferences</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Locale" description="Formatting defaults for dates and numbers.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time zone</Label>
              <Select defaultValue="ist">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">Asia/Kolkata</SelectItem>
                  <SelectItem value="gst">Asia/Dubai</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator className="my-5" />
          <div className="space-y-3">
            <Label>Start of week</Label>
            <RadioGroup defaultValue="mon" className="flex gap-6">
              {[
                ["mon", "Monday"],
                ["sun", "Sunday"],
              ].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={v!} id={v} />
                  {l}
                </label>
              ))}
            </RadioGroup>
          </div>
        </Section>

        <Section title="Notifications & behaviour" description="Placeholder switches only.">
          <div className="space-y-1">
            {toggles.map(([title, sub], i) => (
              <div
                key={title}
                className="flex items-center justify-between gap-4 rounded-lg px-1 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <Switch defaultChecked={i < 3} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const description = "Choose the workspace colour mode and accent used across every module.";

export const Route = createFileRoute("/settings/theme")({
  head: () => ({
    meta: [
      { title: "Theme Settings · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Theme Settings · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: ThemeSettingsPage,
});

const modes = [
  { id: "light" as const, label: "Light", icon: Sun },
  { id: "dark" as const, label: "Dark", icon: Moon },
  { id: "system" as const, label: "System", icon: Monitor },
];

function ThemeSettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <AppShell>
      <PageHeader eyebrow="Settings" title="Theme Settings" description={description} />
      <Section title="Colour mode" description="Applied instantly to the whole workspace.">
        <div className="grid gap-3 sm:grid-cols-3">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setTheme(m.id)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                theme === m.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
              )}
            >
              <m.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">{m.label}</span>
              <span className="text-xs text-muted-foreground">Token-driven, no overrides.</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Accent preview" description="Semantic tokens from the design system.">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["bg-primary", "bg-accent", "bg-muted", "bg-surface-2"].map((c) => (
            <div key={c} className={cn("h-16 rounded-xl border border-border", c)} />
          ))}
        </div>
      </Section>
    </AppShell>
  );
}

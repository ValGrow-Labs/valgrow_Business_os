import { createFileRoute } from "@tanstack/react-router";
import { FileText, Folder, Image as ImageIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section, StatCard } from "@/components/foundation/stat-card";
import { UploadZone } from "@/components/foundation/upload-zone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const description = "Upload, preview and organise workspace files with reusable file components.";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "File Manager · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "File Manager · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: FileManagerPage,
});

const folders = ["Brand", "Contracts", "Onboarding", "Templates"];
const previews = [
  { name: "workspace-cover.png", meta: "PNG · 840 KB", icon: ImageIcon },
  { name: "policy-draft.pdf", meta: "PDF · 1.1 MB", icon: FileText },
  { name: "structure.csv", meta: "CSV · 42 KB", icon: FileText },
];

function FileManagerPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace"
        title="File Manager"
        description={description}
        actions={<Button>New folder</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Files" value="248" hint="Placeholder objects" tone="brand" />
        <StatCard label="Folders" value="12" />
        <StatCard label="Storage used" value="4.2 GB" hint="of 50 GB" />
        <StatCard label="Shared links" value="7" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Upload" description="Drag-and-drop uploader component.">
          <UploadZone />
        </Section>

        <div className="space-y-6">
          <Section title="Folders" description="Flat placeholder hierarchy.">
            <div className="grid gap-3 sm:grid-cols-2">
              {folders.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"
                >
                  <Folder className="h-4 w-4 text-primary" />
                  {f}
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    12 files
                  </Badge>
                </div>
              ))}
            </div>
          </Section>

          <Section title="File preview" description="Reusable preview tiles.">
            <div className="grid gap-3 sm:grid-cols-3">
              {previews.map((p) => (
                <div key={p.name} className="rounded-xl border border-border p-3">
                  <div className="flex h-24 items-center justify-center rounded-lg bg-surface-2">
                    <p.icon className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-2 truncate text-xs font-medium">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.meta}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

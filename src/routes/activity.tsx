import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "actor", header: "Actor" },
  { key: "action", header: "Action" },
  { key: "target", header: "Target" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { actor: "Alex Verma", action: "Updated role", target: "Branch Manager", status: "Success" },
  { actor: "Riya Placeholder", action: "Invited user", target: "placeholder@example.com", status: "Success" },
  { actor: "System", action: "Rotated key", target: "Integration token", status: "Success" },
  { actor: "Sam Placeholder", action: "Deleted file", target: "report.pdf", status: "Failed" },
];

const stats = [
  { label: "Events today", value: "342" },
  { label: "Actors", value: "28" },
  { label: "Modules", value: "6" },
  { label: "Failed actions", value: "3" },
];

const title = "Activity Logs";
const description = "Chronological feed of workspace activity across foundation modules.";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: ActivityLogsPage,
});

function ActivityLogsPage() {
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Workspace"
      actionLabel="Create view"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

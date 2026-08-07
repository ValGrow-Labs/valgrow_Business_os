import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "event", header: "Event" },
  { key: "actor", header: "Actor" },
  { key: "ip", header: "Source" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { event: "permission.granted", actor: "Alex Verma", ip: "103.0.0.1", status: "Success" },
  { event: "security.policy.updated", actor: "Alex Verma", ip: "103.0.0.1", status: "Success" },
  { event: "user.suspended", actor: "Riya Placeholder", ip: "103.0.0.9", status: "Success" },
  { event: "login.failed", actor: "Unknown", ip: "198.51.100.4", status: "Failed" },
];

const stats = [
  { label: "Entries", value: "12,480" },
  { label: "Retention", value: "24 months" },
  { label: "Sensitive events", value: "54" },
  { label: "Exports", value: "6" },
];

const title = "Audit Logs";
const description = "Immutable, compliance-oriented record of sensitive changes.";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Workspace"
      actionLabel="Export audit"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

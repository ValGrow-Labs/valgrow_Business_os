import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Role" },
  { key: "scope", header: "Scope" },
  { key: "members", header: "Members" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { name: "Owner", scope: "Organization", members: "1", status: "Active" },
  { name: "Administrator", scope: "Organization", members: "3", status: "Active" },
  { name: "Branch Manager", scope: "Branch", members: "9", status: "Active" },
  { name: "Viewer", scope: "Branch", members: "46", status: "Active" },
];

const stats = [
  { label: "Roles", value: "8" },
  { label: "System roles", value: "3", hint: "Not editable" },
  { label: "Custom roles", value: "5" },
  { label: "Members assigned", value: "128" },
];

const title = "Roles";
const description = "Role definitions that future modules will map their permissions onto.";

export const Route = createFileRoute("/roles")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Access"
      actionLabel="New role"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

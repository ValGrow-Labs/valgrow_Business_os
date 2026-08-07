import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "key", header: "Permission key" },
  { key: "resource", header: "Resource" },
  { key: "roles", header: "Roles" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { key: "users.read", resource: "Users", roles: "6", status: "Enabled" },
  { key: "users.write", resource: "Users", roles: "3", status: "Enabled" },
  { key: "branches.manage", resource: "Branches", roles: "2", status: "Enabled" },
  { key: "files.delete", resource: "Files", roles: "1", status: "Pending" },
];

const stats = [
  { label: "Permission keys", value: "96" },
  { label: "Resources", value: "18" },
  { label: "Granted to roles", value: "64" },
  { label: "Deprecated", value: "4" },
];

const title = "Permissions";
const description = "Granular permission keys grouped by resource, ready for module wiring.";

export const Route = createFileRoute("/permissions")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: PermissionsPage,
});

function PermissionsPage() {
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Access"
      actionLabel="New permission"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

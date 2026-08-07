import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Team" },
  { key: "department", header: "Department" },
  { key: "members", header: "Members" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { name: "Platform Core", department: "Technology", members: "12", status: "Active" },
  { name: "Field Ops", department: "Operations", members: "24", status: "Active" },
  { name: "Billing Desk", department: "Finance", members: "8", status: "Active" },
  { name: "Legacy Pilot", department: "Operations", members: "0", status: "Revoked" },
];

const stats = [
  { label: "Teams", value: "14" },
  { label: "Members", value: "128" },
  { label: "Private teams", value: "3" },
  { label: "Archived", value: "1" },
];

const title = "Team Management";
const description = "Teams group members inside departments for shared access and notifications.";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: TeamManagementPage,
});

function TeamManagementPage() {
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Organization"
      actionLabel="New team"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Department" },
  { key: "branch", header: "Branch" },
  { key: "head", header: "Head" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { name: "Operations", branch: "Head Office", head: "Placeholder Head", status: "Active" },
  { name: "Finance", branch: "Head Office", head: "Placeholder Head", status: "Active" },
  { name: "Technology", branch: "North Hub", head: "Placeholder Head", status: "Active" },
  { name: "Support", branch: "West Hub", head: "Unassigned", status: "Pending" },
];

const stats = [
  { label: "Departments", value: "9", hint: "Placeholder set" },
  { label: "Teams", value: "14", hint: "Nested groups" },
  { label: "Heads assigned", value: "7" },
  { label: "Unassigned", value: "2" },
];

const title = "Department Management";
const description = "Departments define reporting structure and default access boundaries.";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: DepartmentManagementPage,
});

function DepartmentManagementPage() {
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Organization"
      actionLabel="New department"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

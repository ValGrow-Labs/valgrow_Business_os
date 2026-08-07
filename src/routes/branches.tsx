import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Branch" },
  { key: "city", header: "City" },
  { key: "lead", header: "Branch lead" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { name: "Head Office", city: "Bengaluru", lead: "Placeholder Lead", status: "Active" },
  { name: "North Hub", city: "Delhi", lead: "Placeholder Lead", status: "Active" },
  { name: "West Hub", city: "Mumbai", lead: "Placeholder Lead", status: "Active" },
  { name: "South Hub", city: "Chennai", lead: "Unassigned", status: "Draft" },
];

const stats = [
  { label: "Branches", value: "4", hint: "1 head office" },
  { label: "Regions", value: "3", hint: "Placeholder grouping" },
  { label: "Active", value: "3", hint: "Operational" },
  { label: "Draft", value: "1", hint: "Awaiting setup" },
];

const title = "Branch Management";
const description = "Create, group and configure branches that every future module will inherit.";

export const Route = createFileRoute("/branches")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: BranchManagementPage,
});

function BranchManagementPage() {
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Organization"
      actionLabel="New branch"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

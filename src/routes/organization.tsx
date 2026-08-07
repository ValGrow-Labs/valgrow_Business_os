import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Setting" },
  { key: "value", header: "Value" },
  { key: "scope", header: "Scope" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { name: "Legal name", value: "ValGrow Holdings", scope: "Global", status: "Active" },
  { name: "Default currency", value: "INR", scope: "Global", status: "Active" },
  { name: "Fiscal year start", value: "April", scope: "Global", status: "Active" },
  { name: "Time zone", value: "Asia/Kolkata", scope: "Global", status: "Pending" },
];

const stats = [
  { label: "Branches", value: "4", hint: "Across 4 cities" },
  { label: "Departments", value: "9", hint: "Structure placeholders" },
  { label: "Members", value: "128", hint: "Seats in use" },
  { label: "Plan", value: "Enterprise", hint: "Renews annually" },
];

const title = "Organization Settings";
const description = "Workspace identity, localisation and structure defaults for the active organization.";

export const Route = createFileRoute("/organization")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Organization"
      actionLabel="New organization"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

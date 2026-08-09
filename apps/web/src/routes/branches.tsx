import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useBranches } from "@/hooks/queries/useBranches";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Branch" },
  { key: "city", header: "City" },
  { key: "lead", header: "Branch lead" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
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
  const { data: branchesData } = useBranches();

  const rows: ListRow[] = branchesData
    ? branchesData.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.city,
        lead: b.manager ? `${b.manager.firstName} ${b.manager.lastName}` : "Unassigned",
        status: b.status === "ACTIVE" ? "Active" : "Draft",
      }))
    : [];

  const stats = [
    { label: "Branches", value: String(branchesData?.length || 0), hint: "Operational & Draft" },
    {
      label: "Active",
      value: String(branchesData?.filter((b) => b.status === "ACTIVE").length || 0),
    },
    {
      label: "Draft",
      value: String(branchesData?.filter((b) => b.status === "DRAFT").length || 0),
    },
  ];

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

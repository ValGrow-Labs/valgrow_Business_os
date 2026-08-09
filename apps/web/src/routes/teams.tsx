import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useTeams } from "@/hooks/queries/useTeams";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Team" },
  { key: "department", header: "Department" },
  { key: "lead", header: "Lead" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
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
  const { data: teamsData } = useTeams();

  const rows: ListRow[] = teamsData
    ? teamsData.map((t) => ({
        id: t.id,
        name: t.name,
        department: t.department?.name || "General",
        lead: t.lead ? `${t.lead.firstName} ${t.lead.lastName}` : "Unassigned",
        status: "Active",
      }))
    : [];

  const stats = [
    { label: "Teams", value: String(teamsData?.length || 0) },
    { label: "Leads assigned", value: String(teamsData?.filter((t) => t.lead).length || 0) },
    { label: "Unassigned", value: String(teamsData?.filter((t) => !t.lead).length || 0) },
  ];

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

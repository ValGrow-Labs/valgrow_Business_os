import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useRoles } from "@/hooks/queries/useRoles";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Role" },
  { key: "scope", header: "Scope" },
  { key: "members", header: "Members" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
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
  const { data: rolesData } = useRoles();

  const rows: ListRow[] = rolesData
    ? rolesData.map((r) => ({
        id: r.id,
        name: r.name,
        scope: r.scope,
        members: String(r.membersCount || 0),
        status: "Active",
      }))
    : [];

  const stats = [
    { label: "Roles", value: String(rolesData?.length || 0) },
    { label: "System roles", value: String(rolesData?.filter((r) => r.isSystem).length || 0) },
    { label: "Custom roles", value: String(rolesData?.filter((r) => !r.isSystem).length || 0) },
  ];

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

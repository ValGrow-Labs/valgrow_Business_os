import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { usePermissions } from "@/hooks/queries/usePermissions";

const columns: Column<ListRow>[] = [
  { key: "key", header: "Permission key" },
  { key: "resource", header: "Resource" },
  { key: "action", header: "Action" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
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
  const { data: permissionsData } = usePermissions();

  const rows: ListRow[] = permissionsData
    ? permissionsData.map((p) => ({
        id: p.id,
        key: p.key,
        resource: p.resource,
        action: p.action,
        status: "Enabled",
      }))
    : [];

  const resourcesCount = permissionsData ? new Set(permissionsData.map((p) => p.resource)).size : 0;

  const stats = [
    { label: "Permission keys", value: String(permissionsData?.length || 0) },
    { label: "Resources", value: String(resourcesCount) },
    { label: "Active", value: String(permissionsData?.length || 0) },
  ];

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

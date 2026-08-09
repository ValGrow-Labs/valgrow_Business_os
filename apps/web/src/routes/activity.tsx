import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useActivityLogs } from "@/hooks/queries/useActivityLogs";

const columns: Column<ListRow>[] = [
  { key: "actor", header: "Actor" },
  { key: "action", header: "Action" },
  { key: "target", header: "Target" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Activity Logs";
const description = "Chronological feed of workspace activity across foundation modules.";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: ActivityLogsPage,
});

function ActivityLogsPage() {
  const { data: logsData } = useActivityLogs();

  const rows: ListRow[] = logsData
    ? logsData.map((l) => ({
        id: l.id,
        actor: l.actor,
        action: l.action,
        target: l.target || l.entity,
        status: l.status,
      }))
    : [];

  const stats = [
    { label: "Events logged", value: String(logsData?.length || 0) },
    { label: "Actors", value: String(new Set(logsData?.map((l) => l.actor)).size || 0) },
    {
      label: "Failed actions",
      value: String(logsData?.filter((l) => l.status === "Failed").length || 0),
    },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Workspace"
      actionLabel="Create view"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

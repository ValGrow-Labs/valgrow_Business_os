import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useDepartments } from "@/hooks/queries/useDepartments";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Department" },
  { key: "branch", header: "Branch" },
  { key: "head", header: "Head" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
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
  const { data: departmentsData } = useDepartments();

  const rows: ListRow[] = departmentsData
    ? departmentsData.map((d) => ({
        id: d.id,
        name: d.name,
        branch: d.branch?.name || "Head Office",
        head: d.head ? `${d.head.firstName} ${d.head.lastName}` : "Unassigned",
        status: "Active",
      }))
    : [];

  const stats = [
    { label: "Departments", value: String(departmentsData?.length || 0) },
    { label: "Heads assigned", value: String(departmentsData?.filter((d) => d.head).length || 0) },
    { label: "Unassigned", value: String(departmentsData?.filter((d) => !d.head).length || 0) },
  ];

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

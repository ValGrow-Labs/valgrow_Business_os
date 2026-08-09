import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useUnits } from "@/hooks/queries/useUnits";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Unit Name" },
  { key: "code", header: "Code" },
  { key: "allowDecimals", header: "Fractional / Decimals" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Units of Measure";
const description = "Measurement standards for stock tracking, purchasing, and sales transactions.";

export const Route = createFileRoute("/units")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: UnitsPage,
});

function UnitsPage() {
  const { data: unitsData } = useUnits();

  const rows: ListRow[] = unitsData
    ? unitsData.map((u) => ({
        id: u.id,
        name: u.name,
        code: u.code,
        allowDecimals: u.allowDecimals ? "Supported (e.g. 1.5 KG)" : "Whole Units Only (e.g. 1 PC)",
        status: u.status === "ACTIVE" ? "Active" : "Inactive",
      }))
    : [];

  const stats = [
    { label: "Total Units", value: String(unitsData?.length || 0) },
    {
      label: "Discrete Units",
      value: String(unitsData?.filter((u) => !u.allowDecimals).length || 0),
    },
    {
      label: "Fractional Units",
      value: String(unitsData?.filter((u) => u.allowDecimals).length || 0),
    },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Master Data"
      actionLabel="New unit"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

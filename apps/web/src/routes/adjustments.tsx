import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useInventoryAdjustments } from "@/hooks/queries/useInventoryAdjustments";

const columns: Column<ListRow>[] = [
  { key: "adjustmentNumber", header: "Adjustment No." },
  { key: "reason", header: "Adjustment Reason" },
  { key: "itemsCount", header: "Adjusted Lines" },
  { key: "date", header: "Timestamp" },
];

const title = "Stock Adjustments";
const description = "Physical stock count corrections, damage write-offs, and lot reconciliations.";

export const Route = createFileRoute("/adjustments")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: AdjustmentsPage,
});

function AdjustmentsPage() {
  const { data: adjustmentsData } = useInventoryAdjustments();

  const rows: ListRow[] = adjustmentsData
    ? adjustmentsData.map((a) => ({
        id: a.id,
        adjustmentNumber: a.adjustmentNumber,
        reason: a.reason.replace("_", " "),
        itemsCount: `${a.items?.length || 0} Lines`,
        date: new Date(a.createdAt).toLocaleString(),
      }))
    : [];

  const damagedCount = adjustmentsData?.filter((a) => a.reason === "DAMAGED").length || 0;
  const countCorrCount =
    adjustmentsData?.filter((a) => a.reason === "COUNT_CORRECTION").length || 0;

  const stats = [
    { label: "Total Adjustments", value: String(adjustmentsData?.length || 0) },
    { label: "Damaged / Write-offs", value: String(damagedCount) },
    { label: "Count Corrections", value: String(countCorrCount) },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="New stock adjustment"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

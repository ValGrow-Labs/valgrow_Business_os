import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useInventoryMovements } from "@/hooks/queries/useInventoryMovements";

const columns: Column<ListRow>[] = [
  { key: "date", header: "Timestamp" },
  { key: "type", header: "Movement Type" },
  { key: "quantity", header: "Quantity" },
  { key: "cost", header: "Unit Cost" },
  { key: "total", header: "Total Value" },
  { key: "reference", header: "Audit Reference" },
];

const title = "Stock Movement Ledger";
const description =
  "Immutable double-entry audit history recording all inbound receipts, sales, transfers, and adjustments.";

export const Route = createFileRoute("/movements")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: MovementsPage,
});

function MovementsPage() {
  const [page] = useState(1);
  const { data: movementsData } = useInventoryMovements({ page });

  const rows: ListRow[] = movementsData?.data
    ? movementsData.data.map((m) => {
        const qtyNum = Number(m.quantity);
        const qtyStr = qtyNum > 0 ? `+${qtyNum}` : `${qtyNum}`;

        return {
          id: m.id,
          date: new Date(m.createdAt).toLocaleString(),
          type: m.movementType.replace("_", " "),
          quantity: qtyStr,
          cost: `₹${Number(m.unitCost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          total: `₹${Number(m.totalCost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          reference: m.referenceType
            ? `${m.referenceType}: ${m.referenceId || "N/A"}`
            : "Manual Transaction",
        };
      })
    : [];

  const totalEntries = movementsData?.meta?.total || 0;

  const stats = [
    { label: "Ledger Entries", value: String(totalEntries), hint: "Immutable Audit Log" },
    { label: "System Status", value: "Append-Only Synchronized" },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="Export audit ledger"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

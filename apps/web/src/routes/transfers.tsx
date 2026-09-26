import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useInventoryTransfers } from "@/hooks/queries/useInventoryTransfers";

const columns: Column<ListRow>[] = [
  { key: "transferNumber", header: "Transfer No." },
  { key: "source", header: "Source Warehouse" },
  { key: "destination", header: "Destination Warehouse" },
  { key: "itemsCount", header: "Item Lines" },
  { key: "createdDate", header: "Date Created" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Stock Transfers";
const description = "Inter-warehouse and inter-location inventory shipments and transit workflows.";

export const Route = createFileRoute("/transfers")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: TransfersPage,
});

function TransfersPage() {
  const { data: transfersData } = useInventoryTransfers();

  const rows: ListRow[] = transfersData
    ? transfersData.map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        source: t.sourceWarehouse?.name || "Unknown Warehouse",
        destination: t.destWarehouse?.name || "Unknown Warehouse",
        itemsCount: `${t.items?.length || 0} Lines`,
        createdDate: new Date(t.createdAt).toLocaleDateString(),
        status:
          t.status === "COMPLETED"
            ? "Active"
            : t.status === "IN_TRANSIT" || t.status === "PENDING"
              ? "Pending"
              : "Draft",
      }))
    : [];

  const completedCount = transfersData?.filter((t) => t.status === "COMPLETED").length || 0;
  const inTransitCount = transfersData?.filter((t) => t.status === "IN_TRANSIT").length || 0;

  const stats = [
    { label: "Total Transfers", value: String(transfersData?.length || 0) },
    { label: "In Transit", value: String(inTransitCount) },
    { label: "Completed", value: String(completedCount) },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="New stock transfer"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

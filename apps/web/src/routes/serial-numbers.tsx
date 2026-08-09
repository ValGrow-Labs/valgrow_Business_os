import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useInventorySerialNumbers } from "@/hooks/queries/useInventorySerialNumbers";

const columns: Column<ListRow>[] = [
  { key: "serialNumber", header: "Serial Number" },
  { key: "product", header: "Product" },
  { key: "variant", header: "Variant" },
  { key: "location", header: "Location" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Serial Number Registry";
const description = "Individually tracked serialized hardware, high-value electronics, and assets.";

export const Route = createFileRoute("/serial-numbers")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: SerialNumbersPage,
});

function SerialNumbersPage() {
  const { data: serialsData } = useInventorySerialNumbers();

  const rows: ListRow[] = serialsData
    ? serialsData.map((s) => ({
        id: s.id,
        serialNumber: s.serialNumber,
        product: s.product?.name || "Unassigned",
        variant: s.variant?.name || "Base Item",
        location: s.location ? `${s.location.name} (${s.location.code})` : "Unassigned Location",
        status: s.status === "AVAILABLE" ? "Active" : s.status === "SOLD" ? "Inactive" : "Pending",
      }))
    : [];

  const availableCount = serialsData?.filter((s) => s.status === "AVAILABLE").length || 0;
  const soldCount = serialsData?.filter((s) => s.status === "SOLD").length || 0;

  const stats = [
    { label: "Total Serials", value: String(serialsData?.length || 0) },
    { label: "Available In Stock", value: String(availableCount) },
    { label: "Dispatched / Sold", value: String(soldCount) },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="Register serial"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

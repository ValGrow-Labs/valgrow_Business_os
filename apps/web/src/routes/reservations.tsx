import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useInventoryReservations } from "@/hooks/queries/useInventoryReservations";

const columns: Column<ListRow>[] = [
  { key: "reference", header: "Order / Cart Reference" },
  { key: "location", header: "Location" },
  { key: "quantity", header: "Locked Quantity" },
  { key: "expiresAt", header: "Reservation Expiry" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Stock Reservations";
const description =
  "Temporary inventory holds for active POS checkouts, sales orders, and ecommerce carts.";

export const Route = createFileRoute("/reservations")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: ReservationsPage,
});

function ReservationsPage() {
  const { data: reservationsData } = useInventoryReservations();

  const rows: ListRow[] = reservationsData
    ? reservationsData.map((r) => ({
        id: r.id,
        reference: `${r.referenceType}: ${r.referenceId}`,
        location: r.location ? `${r.location.name} (${r.location.code})` : "Unassigned",
        quantity: `${r.quantity} Units`,
        expiresAt: new Date(r.expiresAt).toLocaleString(),
        status: r.status === "ACTIVE" ? "Pending" : r.status === "FULFILLED" ? "Active" : "Draft",
      }))
    : [];

  const activeCount = reservationsData?.filter((r) => r.status === "ACTIVE").length || 0;
  const fulfilledCount = reservationsData?.filter((r) => r.status === "FULFILLED").length || 0;

  const stats = [
    { label: "Active Reservations", value: String(activeCount), hint: "Holding stock" },
    { label: "Fulfilled Orders", value: String(fulfilledCount) },
    { label: "Total Reservations", value: String(reservationsData?.length || 0) },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="New stock hold"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

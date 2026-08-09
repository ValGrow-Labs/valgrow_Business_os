import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useInventoryStock } from "@/hooks/queries/useInventoryStock";

const columns: Column<ListRow>[] = [
  { key: "product", header: "Product" },
  { key: "variant", header: "Variant" },
  { key: "facility", header: "Warehouse & Location" },
  { key: "batch", header: "Batch No." },
  { key: "onHand", header: "On Hand Qty" },
  { key: "reserved", header: "Reserved Qty" },
  { key: "available", header: "Available Stock" },
];

const title = "Live Stock Levels";
const description =
  "Real-time stock availability, reservations, and location placement across all warehouses.";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: InventoryStockPage,
});

function InventoryStockPage() {
  const [page] = useState(1);
  const [search] = useState("");
  const { data: stockData } = useInventoryStock({ page, search });

  const rows: ListRow[] = stockData?.data
    ? stockData.data.map((s) => ({
        id: s.id,
        product: s.product?.name || "Unassigned Product",
        variant: s.variant?.name || "Base Product",
        facility: `${s.warehouse?.name || "N/A"} → ${s.location?.name || "N/A"}`,
        batch: s.batch?.batchNumber || "Non-Batched",
        onHand: `${s.onHand} Units`,
        reserved: `${s.reserved} Units`,
        available: `${s.available} Units`,
      }))
    : [];

  const totalOnHand = stockData?.data?.reduce((acc, curr) => acc + curr.onHand, 0) || 0;
  const totalReserved = stockData?.data?.reduce((acc, curr) => acc + curr.reserved, 0) || 0;
  const totalAvailable = stockData?.data?.reduce((acc, curr) => acc + curr.available, 0) || 0;

  const stats = [
    { label: "Total On Hand", value: String(totalOnHand), hint: "Physical stock" },
    { label: "Total Reserved", value: String(totalReserved), hint: "Locked in carts / orders" },
    { label: "Total Available", value: String(totalAvailable), hint: "onHand - reserved" },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="Export stock report"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

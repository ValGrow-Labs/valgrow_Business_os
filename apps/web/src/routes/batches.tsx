import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useInventoryBatches } from "@/hooks/queries/useInventoryBatches";

const columns: Column<ListRow>[] = [
  { key: "batchNumber", header: "Batch Number" },
  { key: "product", header: "Product" },
  { key: "variant", header: "Variant" },
  { key: "mfgDate", header: "Manufacture Date" },
  { key: "expDate", header: "Expiry Date" },
  { key: "cost", header: "Batch Cost" },
];

const title = "Inventory Batches";
const description =
  "Lot numbers, manufacturing dates, and expiration tracking for perishable or batched goods.";

export const Route = createFileRoute("/batches")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: BatchesPage,
});

function BatchesPage() {
  const { data: batchesData } = useInventoryBatches();

  const rows: ListRow[] = batchesData
    ? batchesData.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        product: b.product?.name || "Unassigned",
        variant: b.variant?.name || "Base Product",
        mfgDate: b.manufactureDate ? new Date(b.manufactureDate).toLocaleDateString() : "N/A",
        expDate: b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "No Expiry",
        cost: `₹${Number(b.costPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      }))
    : [];

  const now = new Date();
  const expiredCount =
    batchesData?.filter((b) => b.expiryDate && new Date(b.expiryDate) < now).length || 0;

  const stats = [
    { label: "Total Batches", value: String(batchesData?.length || 0) },
    { label: "Active Lot Layers", value: String((batchesData?.length || 0) - expiredCount) },
    { label: "Expired Lots", value: String(expiredCount) },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="New batch lot"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

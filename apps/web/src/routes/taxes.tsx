import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useTaxes } from "@/hooks/queries/useTaxes";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Tax Name" },
  { key: "code", header: "Code" },
  { key: "rate", header: "Tax Rate" },
  { key: "type", header: "Type" },
  { key: "mode", header: "Price Inclusion" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Tax Rules & Rates";
const description =
  "Tax rates applied to product lines across sales, purchasing, and POS invoices.";

export const Route = createFileRoute("/taxes")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: TaxesPage,
});

function TaxesPage() {
  const { data: taxesData } = useTaxes();

  const rows: ListRow[] = taxesData
    ? taxesData.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code || "N/A",
        rate: `${Number(t.rate)}%`,
        type: t.type,
        mode: t.isInclusive ? "Tax Inclusive" : "Tax Exclusive",
        status: t.status === "ACTIVE" ? "Active" : "Inactive",
      }))
    : [];

  const stats = [
    { label: "Tax Rules", value: String(taxesData?.length || 0) },
    { label: "GST Rules", value: String(taxesData?.filter((t) => t.type === "GST").length || 0) },
    {
      label: "VAT / Custom",
      value: String(taxesData?.filter((t) => t.type !== "GST").length || 0),
    },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Master Data"
      actionLabel="New tax rate"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

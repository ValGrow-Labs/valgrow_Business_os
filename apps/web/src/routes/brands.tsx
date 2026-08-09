import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useBrands } from "@/hooks/queries/useBrands";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Brand" },
  { key: "slug", header: "Slug" },
  { key: "description", header: "Description" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Brands";
const description = "Manufacturer and vendor brand identity master records.";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  const { data: brandsData } = useBrands();

  const rows: ListRow[] = brandsData
    ? brandsData.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description || "N/A",
        status: b.status === "ACTIVE" ? "Active" : "Inactive",
      }))
    : [];

  const stats = [
    { label: "Total Brands", value: String(brandsData?.length || 0) },
    {
      label: "Active Brands",
      value: String(brandsData?.filter((b) => b.status === "ACTIVE").length || 0),
    },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Master Data"
      actionLabel="New brand"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

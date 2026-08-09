import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useCategories } from "@/hooks/queries/useCategories";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Category" },
  { key: "parent", header: "Parent Category" },
  { key: "slug", header: "Slug" },
  { key: "description", header: "Description" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Categories";
const description = "Hierarchical taxonomy for organizing products and inventory catalogs.";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categoriesData } = useCategories();

  const rows: ListRow[] = categoriesData
    ? categoriesData.map((c) => ({
        id: c.id,
        name: c.name,
        parent: c.parent ? c.parent.name : "Root Category",
        slug: c.slug,
        description: c.description || "N/A",
        status: c.status === "ACTIVE" ? "Active" : "Inactive",
      }))
    : [];

  const stats = [
    { label: "Total Categories", value: String(categoriesData?.length || 0) },
    {
      label: "Root Categories",
      value: String(categoriesData?.filter((c) => !c.parentId).length || 0),
    },
    {
      label: "Sub-Categories",
      value: String(categoriesData?.filter((c) => c.parentId).length || 0),
    },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Master Data"
      actionLabel="New category"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useProducts, useDeleteProduct } from "@/hooks/queries/useProducts";
import { Button } from "@/components/ui/button";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Product" },
  { key: "sku", header: "SKU" },
  { key: "category", header: "Category" },
  { key: "brand", header: "Brand" },
  { key: "type", header: "Type" },
  { key: "price", header: "Selling Price" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Products & Catalog";
const description =
  "Master catalog of physical goods, services, and digital items across tenant branches.";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [page] = useState(1);
  const [search] = useState("");
  const { data: productsData } = useProducts({ page, search });
  const deleteProductMutation = useDeleteProduct();

  const rows: ListRow[] = productsData?.data
    ? productsData.data.map((p) => {
        const defaultRetailPrice = p.priceLevels?.find(
          (pr: any) => pr.tier === "RETAIL" && !pr.variantId,
        )?.price;

        const priceStr = defaultRetailPrice
          ? `₹${Number(defaultRetailPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
          : "₹0.00";

        return {
          id: p.id,
          name: p.name,
          sku: p.sku || "N/A",
          category: p.category?.name || "Unassigned",
          brand: p.brand?.name || "Generic",
          type: p.type,
          price: priceStr,
          status: p.status === "ACTIVE" ? "Active" : p.status === "DRAFT" ? "Draft" : "Archived",
        };
      })
    : [];

  const totalProducts = productsData?.meta?.total || 0;
  const activeProducts = productsData?.data?.filter((p) => p.status === "ACTIVE").length || 0;

  const stats = [
    { label: "Total Products", value: String(totalProducts), hint: "Catalog items" },
    { label: "Active Items", value: String(activeProducts) },
    {
      label: "Categories",
      value: String(new Set(productsData?.data?.map((p) => p.categoryId).filter(Boolean)).size),
    },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Master Data"
      actionLabel="New product"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

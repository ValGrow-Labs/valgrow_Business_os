import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useWarehouses } from "@/hooks/queries/useWarehouses";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Warehouse" },
  { key: "code", header: "Code" },
  { key: "branch", header: "Assigned Branch" },
  { key: "city", header: "City" },
  { key: "locations", header: "Active Locations" },
  { key: "isDefault", header: "Default Warehouse" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Warehouses";
const description = "Physical storage facilities, depots, and regional distribution centers.";

export const Route = createFileRoute("/warehouses")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: WarehousesPage,
});

function WarehousesPage() {
  const { data: warehousesData } = useWarehouses();

  const rows: ListRow[] = warehousesData
    ? warehousesData.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        branch: w.branch ? `${w.branch.name} (${w.branch.city})` : "Central / Unassigned",
        city: w.city || "N/A",
        locations: String(w._count?.locations || 0),
        isDefault: w.isDefault ? "Primary Facility" : "Standard Warehouse",
        status: w.status === "ACTIVE" ? "Active" : "Inactive",
      }))
    : [];

  const stats = [
    { label: "Total Warehouses", value: String(warehousesData?.length || 0) },
    {
      label: "Active Depots",
      value: String(warehousesData?.filter((w) => w.status === "ACTIVE").length || 0),
    },
    {
      label: "Branch Assigned",
      value: String(warehousesData?.filter((w) => w.branchId).length || 0),
    },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="New warehouse"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

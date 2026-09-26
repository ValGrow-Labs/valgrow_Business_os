import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useWarehouses } from "@/hooks/queries/useWarehouses";
import { useLocations } from "@/hooks/queries/useLocations";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Location Name" },
  { key: "code", header: "Code" },
  { key: "placement", header: "Bin / Shelf / Aisle" },
  { key: "isDefault", header: "Default Location" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Warehouse Locations";
const description = "Physical shelf, bin, rack, and aisle positions within tenant warehouses.";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const { data: warehouses } = useWarehouses();
  const selectedWarehouseId = warehouses?.[0]?.id || "";
  const { data: locationsData } = useLocations(selectedWarehouseId);

  const rows: ListRow[] = locationsData
    ? locationsData.map((l) => {
        const placementParts = [
          l.aisle && `Aisle ${l.aisle}`,
          l.rack && `Rack ${l.rack}`,
          l.shelf && `Shelf ${l.shelf}`,
          l.bin && `Bin ${l.bin}`,
        ].filter(Boolean);
        const placementStr =
          placementParts.length > 0 ? placementParts.join(" · ") : "General Area";

        return {
          id: l.id,
          name: l.name,
          code: l.code,
          placement: placementStr,
          isDefault: l.isDefault ? "Default Receiving Bay" : "Storage Bin",
          status: l.status === "ACTIVE" ? "Active" : "Inactive",
        };
      })
    : [];

  const stats = [
    {
      label: "Active Locations",
      value: String(locationsData?.length || 0),
      hint: warehouses?.[0]?.name || "Select Warehouse",
    },
    { label: "Total Warehouses", value: String(warehouses?.length || 0) },
  ];

  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Inventory"
      actionLabel="New location"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}

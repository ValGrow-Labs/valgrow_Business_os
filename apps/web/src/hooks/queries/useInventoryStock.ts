import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type StockHealthStatus = "OK" | "LOW" | "OUT";

export interface StockItem {
  id: string;
  organizationId: string;
  warehouseId: string;
  locationId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  onHand: number;
  reserved: number;
  available: number;
  reorderLevel: number | null;
  reorderQuantity: number | null;
  stockHealth?: StockHealthStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  warehouse?: { id: string; name: string; code: string; branchId?: string } | null;
  location?: { id: string; name: string; code: string } | null;
  product?: { id: string; name: string; sku: string; costPrice: number | string } | null;
  variant?: { id: string; name: string; sku: string } | null;
  batch?: { id: string; batchNumber: string; expiryDate: string | null } | null;
}

export interface StockResponse {
  data: StockItem[];
  summary?: {
    totalOnHand: number;
    totalReserved: number;
    totalAvailable: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalRecords: number;
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StockQueryParams {
  warehouseId?: string | undefined;
  branchId?: string | undefined;
  locationId?: string | undefined;
  productId?: string | undefined;
  variantId?: string | undefined;
  batchId?: string | undefined;
  lowStock?: boolean | undefined;
  health?: StockHealthStatus | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}


export function buildStockQueryString(params?: StockQueryParams): string {
  const queryParams = new URLSearchParams();
  if (params?.warehouseId) queryParams.set("warehouseId", params.warehouseId);
  if (params?.branchId) queryParams.set("branchId", params.branchId);
  if (params?.locationId) queryParams.set("locationId", params.locationId);
  if (params?.productId) queryParams.set("productId", params.productId);
  if (params?.variantId) queryParams.set("variantId", params.variantId);
  if (params?.batchId) queryParams.set("batchId", params.batchId);
  if (params?.lowStock) queryParams.set("lowStock", "true");
  if (params?.health) queryParams.set("health", params.health);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.set("sortOrder", params.sortOrder);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return queryParams.toString() ? `?${queryParams.toString()}` : "";
}

export function useInventoryStock(params?: StockQueryParams) {
  const queryStr = buildStockQueryString(params);

  return useQuery<StockResponse>({
    queryKey: ["inventoryStock", params],
    queryFn: () => apiClient<StockResponse>(`/inventory/stock${queryStr}`),
    // Auto-refresh every 30 seconds so stock levels stay current
    // without the user needing to manually reload the page.
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useInventoryStockById(id: string) {
  return useQuery<StockItem>({
    queryKey: ["inventoryStockItem", id],
    queryFn: () => apiClient<StockItem>(`/inventory/stock/${id}`),
    enabled: Boolean(id),
  });
}

export function downloadStockExport(format: "csv" | "pdf", params?: StockQueryParams) {
  const queryStr = buildStockQueryString(params);
  const endpoint = `/api/inventory/stock/export/${format}${queryStr}`;
  window.open(endpoint, "_blank");
}


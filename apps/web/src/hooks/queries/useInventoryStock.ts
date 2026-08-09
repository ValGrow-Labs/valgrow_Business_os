import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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
  version: number;
  createdAt: string;
  updatedAt: string;
  warehouse?: { id: string; name: string; code: string } | null;
  location?: { id: string; name: string; code: string } | null;
  product?: { id: string; name: string; sku: string; costPrice: number | string } | null;
  variant?: { id: string; name: string; sku: string } | null;
  batch?: { id: string; batchNumber: string; expiryDate: string | null } | null;
}

export interface StockResponse {
  data: StockItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StockQueryParams {
  warehouseId?: string;
  locationId?: string;
  productId?: string;
  variantId?: string;
  batchId?: string;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export function useInventoryStock(params?: StockQueryParams) {
  const queryParams = new URLSearchParams();
  if (params?.warehouseId) queryParams.set("warehouseId", params.warehouseId);
  if (params?.locationId) queryParams.set("locationId", params.locationId);
  if (params?.productId) queryParams.set("productId", params.productId);
  if (params?.variantId) queryParams.set("variantId", params.variantId);
  if (params?.batchId) queryParams.set("batchId", params.batchId);
  if (params?.lowStock) queryParams.set("lowStock", "true");
  if (params?.search) queryParams.set("search", params.search);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<StockResponse>({
    queryKey: ["inventoryStock", params],
    queryFn: () => apiClient<StockResponse>(`/inventory/stock${queryStr}`),
  });
}

export function useInventoryStockById(id: string) {
  return useQuery<StockItem>({
    queryKey: ["inventoryStockItem", id],
    queryFn: () => apiClient<StockItem>(`/inventory/stock/${id}`),
    enabled: Boolean(id),
  });
}

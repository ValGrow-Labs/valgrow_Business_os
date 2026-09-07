import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface BatchWarehouse {
  id: string;
  name: string;
  code: string;
}

export interface BatchItem {
  id: string;
  organizationId: string;
  productId: string;
  variantId: string | null;
  batchNumber: string;
  batchType?: string;
  workOrderRef?: string | null;
  manufactureDate: string | null;
  expiryDate: string | null;
  costPrice: number | string;
  quantityRemaining?: number;
  warehouses?: BatchWarehouse[];
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string; sku: string } | null;
  variant?: { id: string; name: string; sku: string } | null;
}

export interface BatchQueryParams {
  productId?: string | undefined;
  variantId?: string | undefined;
  batchType?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
  expired?: boolean | undefined;
  expiringSoonDays?: number | undefined;
}

export function useInventoryBatches(params?: BatchQueryParams) {
  const queryParams = new URLSearchParams();
  if (params?.productId) queryParams.set("productId", params.productId);
  if (params?.variantId) queryParams.set("variantId", params.variantId);
  if (params?.batchType && params.batchType !== "ALL")
    queryParams.set("batchType", params.batchType);
  if (params?.status && params.status !== "ALL")
    queryParams.set("status", params.status);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.expired) queryParams.set("expired", "true");
  if (params?.expiringSoonDays)
    queryParams.set("expiringSoonDays", String(params.expiringSoonDays));

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<BatchItem[]>({
    queryKey: ["inventoryBatches", params],
    queryFn: () => apiClient<BatchItem[]>(`/inventory/batches${queryStr}`),
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BatchItem>) =>
      apiClient<BatchItem>("/inventory/batches", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryBatches"] });
    },
  });
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BatchItem> }) =>
      apiClient<BatchItem>(`/inventory/batches/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryBatches"] });
    },
  });
}

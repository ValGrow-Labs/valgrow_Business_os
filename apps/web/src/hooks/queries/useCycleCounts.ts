import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type CycleCountStatus = "DRAFT" | "COUNTING" | "COMPLETED" | "POSTED";

export interface CycleCountSummaryItem {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: CycleCountStatus;
  notes: string | null;
  countedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  totalItems: number;
  countedItems: number;
  varianceItems: number;
}

export interface CycleCountDetailItem {
  id: string;
  locationId: string | null;
  locationName: string;
  productId: string;
  productName: string;
  productSku: string;
  variantName: string;
  batchNumber: string;
  systemQty: number;
  countedQty: number | null;
  variance: number | null;
  unitCost: number;
  varianceValue: number | null;
  notes: string | null;
}

export interface CycleCountDetailResponse {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: CycleCountStatus;
  notes: string | null;
  countedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  items: CycleCountDetailItem[];
}

export function useCycleCounts(params?: { warehouseId?: string; status?: CycleCountStatus }) {
  const queryStr = new URLSearchParams();
  if (params?.warehouseId) queryStr.set("warehouseId", params.warehouseId);
  if (params?.status) queryStr.set("status", params.status);

  return useQuery<CycleCountSummaryItem[]>({
    queryKey: ["cycleCounts", params],
    queryFn: () => apiClient<CycleCountSummaryItem[]>(`/inventory/cycle-counts?${queryStr.toString()}`),
  });
}

export function useCycleCountById(id: string) {
  return useQuery<CycleCountDetailResponse>({
    queryKey: ["cycleCountDetail", id],
    queryFn: () => apiClient<CycleCountDetailResponse>(`/inventory/cycle-counts/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCycleCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { warehouseId: string; notes?: string }) =>
      apiClient("/inventory/cycle-counts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycleCounts"] });
    },
  });
}

export function useUpdateCountItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      items,
    }: {
      id: string;
      items: { itemId: string; countedQty: number; notes?: string }[];
    }) =>
      apiClient(`/inventory/cycle-counts/${id}/items`, {
        method: "PATCH",
        body: JSON.stringify({ items }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cycleCountDetail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["cycleCounts"] });
    },
  });
}

export function usePostCycleCountVariances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/inventory/cycle-counts/${id}/post`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["cycleCountDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["cycleCounts"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStock"] });
    },
  });
}

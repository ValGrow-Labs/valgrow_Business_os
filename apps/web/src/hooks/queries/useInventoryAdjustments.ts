import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AdjustmentItemLine {
  id: string;
  adjustmentId: string;
  locationId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  currentQty: number | string;
  adjustedQty: number | string;
  newQty: number | string;
  unitCost: number | string;
  location?: {
    id: string;
    name: string;
    code: string;
  } | undefined;
  product?: {
    id: string;
    name: string;
    sku: string;
  } | undefined;
  variant?: {
    id: string;
    name: string;
    sku: string;
  } | null | undefined;
}

export interface AdjustmentItem {
  id: string;
  organizationId: string;
  adjustmentNumber: string;
  warehouseId: string;
  reason: string;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  } | undefined;
  items?: AdjustmentItemLine[] | undefined;
}

export interface CreateAdjustmentLineInput {
  locationId: string;
  productId: string;
  variantId?: string | null | undefined;
  batchId?: string | null | undefined;
  currentQty: number;
  adjustedQty: number;
  newQty: number;
  unitCost?: number | undefined;
}

export interface CreateAdjustmentPayload {
  adjustmentNumber: string;
  warehouseId: string;
  reason: string;
  notes?: string | undefined;
  items: CreateAdjustmentLineInput[];
}

export interface UseInventoryAdjustmentsOptions {
  search?: string | undefined;
  reason?: string | undefined;
  warehouseId?: string | undefined;
}

export function useInventoryAdjustments(options?: UseInventoryAdjustmentsOptions) {
  const queryParams = new URLSearchParams();
  if (options?.search) queryParams.set("search", options.search);
  if (options?.reason && options.reason !== "ALL") queryParams.set("reason", options.reason);
  if (options?.warehouseId && options.warehouseId !== "ALL") queryParams.set("warehouseId", options.warehouseId);

  const queryString = queryParams.toString();
  const url = `/inventory/adjustments${queryString ? `?${queryString}` : ""}`;

  return useQuery<AdjustmentItem[]>({
    queryKey: ["inventoryAdjustments", options],
    queryFn: () => apiClient<AdjustmentItem[]>(url),
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdjustmentPayload) =>
      apiClient<AdjustmentItem>("/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryAdjustments"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStock"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryMovements"] });
      queryClient.invalidateQueries({ queryKey: ["activityLogs"] });
    },
  });
}

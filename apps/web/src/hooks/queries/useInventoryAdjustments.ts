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
  items?: AdjustmentItemLine[];
}

export function useInventoryAdjustments() {
  return useQuery<AdjustmentItem[]>({
    queryKey: ["inventoryAdjustments"],
    queryFn: () => apiClient<AdjustmentItem[]>("/inventory/adjustments"),
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdjustmentItem>) =>
      apiClient<AdjustmentItem>("/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryAdjustments"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStock"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryMovements"] });
    },
  });
}

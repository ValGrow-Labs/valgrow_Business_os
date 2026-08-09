import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface MovementItem {
  id: string;
  organizationId: string;
  branchId: string | null;
  warehouseId: string;
  locationId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  serialNumberId: string | null;
  serialNumber: string | null;
  movementType: string;
  quantity: number | string;
  unitCost: number | string;
  totalCost: number | string;
  referenceType: string | null;
  referenceId: string | null;
  actorId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MovementResponse {
  data: MovementItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MovementQueryParams {
  locationId?: string;
  productId?: string;
  variantId?: string;
  movementType?: string;
  page?: number;
  limit?: number;
}

export function useInventoryMovements(params?: MovementQueryParams) {
  const queryParams = new URLSearchParams();
  if (params?.locationId) queryParams.set("locationId", params.locationId);
  if (params?.productId) queryParams.set("productId", params.productId);
  if (params?.variantId) queryParams.set("variantId", params.variantId);
  if (params?.movementType) queryParams.set("movementType", params.movementType);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<MovementResponse>({
    queryKey: ["inventoryMovements", params],
    queryFn: () => apiClient<MovementResponse>(`/inventory/movements${queryStr}`),
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MovementItem>) =>
      apiClient<MovementItem>("/inventory/movements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryMovements"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStock"] });
    },
  });
}

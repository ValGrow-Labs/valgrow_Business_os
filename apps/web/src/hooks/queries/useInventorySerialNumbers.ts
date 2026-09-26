import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SerialNumberItem {
  id: string;
  organizationId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  locationId: string;
  serialNumber: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "RETURNED" | "DEFECTIVE";
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string; sku: string } | null;
  variant?: { id: string; name: string; sku: string } | null;
  location?: { id: string; name: string; code: string } | null;
}

export interface SerialQueryParams {
  productId?: string;
  status?: string;
}

export function useInventorySerialNumbers(params?: SerialQueryParams) {
  const queryParams = new URLSearchParams();
  if (params?.productId) queryParams.set("productId", params.productId);
  if (params?.status) queryParams.set("status", params.status);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<SerialNumberItem[]>({
    queryKey: ["inventorySerialNumbers", params],
    queryFn: () => apiClient<SerialNumberItem[]>(`/inventory/serial-numbers${queryStr}`),
  });
}

export function useCreateSerial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SerialNumberItem>) =>
      apiClient<SerialNumberItem>("/inventory/serial-numbers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventorySerialNumbers"] });
    },
  });
}

export function useUpdateSerial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SerialNumberItem> }) =>
      apiClient<SerialNumberItem>(`/inventory/serial-numbers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventorySerialNumbers"] });
    },
  });
}

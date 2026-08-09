import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface LocationItem {
  id: string;
  organizationId: string;
  warehouseId: string;
  name: string;
  code: string;
  aisle: string | null;
  rack: string | null;
  shelf: string | null;
  bin: string | null;
  isDefault: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export function useLocations(warehouseId: string) {
  return useQuery<LocationItem[]>({
    queryKey: ["locations", warehouseId],
    queryFn: () => apiClient<LocationItem[]>(`/warehouses/${warehouseId}/locations`),
    enabled: Boolean(warehouseId),
  });
}

export function useCreateLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LocationItem>) =>
      apiClient<LocationItem>(`/warehouses/${warehouseId}/locations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", warehouseId] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LocationItem> }) =>
      apiClient<LocationItem>(`/warehouses/${warehouseId}/locations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", warehouseId] });
    },
  });
}

export function useDeleteLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/warehouses/${warehouseId}/locations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", warehouseId] });
    },
  });
}

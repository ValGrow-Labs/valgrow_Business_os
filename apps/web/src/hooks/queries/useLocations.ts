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
  warehouse?: { id: string; name: string; code: string } | null;
}

export function useLocations(
  warehouseIdOrParams?: string | { warehouseId?: string | undefined; status?: string | undefined }
) {
  const params = typeof warehouseIdOrParams === "string" ? { warehouseId: warehouseIdOrParams } : warehouseIdOrParams;
  const queryParams = new URLSearchParams();
  if (params?.warehouseId && params.warehouseId !== "ALL") queryParams.set("warehouseId", params.warehouseId);
  if (params?.status && params.status !== "ALL") queryParams.set("status", params.status);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<LocationItem[]>({
    queryKey: ["locations", params],
    queryFn: () => apiClient<LocationItem[]>(`/locations${queryStr}`),
  });
}


export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, data }: { warehouseId: string; data: Partial<LocationItem> }) =>
      apiClient<LocationItem>(`/warehouses/${warehouseId}/locations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      warehouseId,
      id,
      data,
    }: {
      warehouseId: string;
      id: string;
      data: Partial<LocationItem>;
    }) =>
      apiClient<LocationItem>(`/warehouses/${warehouseId}/locations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, id }: { warehouseId: string; id: string }) =>
      apiClient(`/warehouses/${warehouseId}/locations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}


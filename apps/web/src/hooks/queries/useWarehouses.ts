import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface WarehouseItem {
  id: string;
  organizationId: string;
  branchId: string | null;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  isDefault: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string | null; city: string } | null;
  _count?: { locations: number };
}

export function useWarehouses() {
  return useQuery<WarehouseItem[]>({
    queryKey: ["warehouses"],
    queryFn: () => apiClient<WarehouseItem[]>("/warehouses"),
  });
}

export function useWarehouse(id: string) {
  return useQuery<WarehouseItem>({
    queryKey: ["warehouse", id],
    queryFn: () => apiClient<WarehouseItem>(`/warehouses/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WarehouseItem>) =>
      apiClient<WarehouseItem>("/warehouses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarehouseItem> }) =>
      apiClient<WarehouseItem>(`/warehouses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/warehouses/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

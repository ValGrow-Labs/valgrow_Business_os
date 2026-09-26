import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface LocationItem {
  id: string;
  name: string;
  code: string;
  aisle?: string | null;
  rack?: string | null;
  shelf?: string | null;
  bin?: string | null;
  status: string;
}

export interface WarehouseStockSummary {
  totalProducts: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
}

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
  locations?: LocationItem[];
  stockSummary?: WarehouseStockSummary;
  _count?: { locations: number };
}

export function useWarehouses(params?: { branchId?: string | undefined; status?: string | undefined }) {

  const queryParams = new URLSearchParams();
  if (params?.branchId && params.branchId !== "ALL") queryParams.set("branchId", params.branchId);
  if (params?.status && params.status !== "ALL") queryParams.set("status", params.status);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<WarehouseItem[]>({
    queryKey: ["warehouses", params],
    queryFn: () => apiClient<WarehouseItem[]>(`/warehouses${queryStr}`),
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

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SupplierContactItem {
  id: string;
  organizationId: string;
  supplierId: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierItem {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  taxIdNumber: string | null;
  currency: string;
  paymentTerms: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  contacts?: SupplierContactItem[];
  _count?: { purchaseOrders: number };
}

export interface SupplierParams {
  search?: string | undefined;
  status?: string | undefined;
}

export function useSuppliers(params?: SupplierParams) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.status && params.status !== "ALL") queryParams.set("status", params.status);
  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<SupplierItem[]>({
    queryKey: ["suppliers", params],
    queryFn: () => apiClient<SupplierItem[]>(`/suppliers${queryStr}`),
    placeholderData: keepPreviousData,
  });
}

export function useSupplier(id: string) {
  return useQuery<SupplierItem>({
    queryKey: ["supplier", id],
    queryFn: () => apiClient<SupplierItem>(`/suppliers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SupplierItem>) =>
      apiClient<SupplierItem>("/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierItem> }) =>
      apiClient<SupplierItem>(`/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", id] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/suppliers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { SupplierContactItem } from "./useSuppliers";

export function useSupplierContacts(supplierId: string) {
  return useQuery<SupplierContactItem[]>({
    queryKey: ["supplier-contacts", supplierId],
    queryFn: () => apiClient<SupplierContactItem[]>(`/suppliers/${supplierId}/contacts`),
    enabled: Boolean(supplierId),
  });
}

export function useCreateSupplierContact(supplierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SupplierContactItem>) =>
      apiClient<SupplierContactItem>(`/suppliers/${supplierId}/contacts`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-contacts", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
    },
  });
}

export function useUpdateSupplierContact(supplierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierContactItem> }) =>
      apiClient<SupplierContactItem>(`/suppliers/${supplierId}/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-contacts", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
    },
  });
}

export function useDeleteSupplierContact(supplierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/suppliers/${supplierId}/contacts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-contacts", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CustomerContactItem {
  id: string;
  organizationId: string;
  customerId: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export function useCustomerContacts(customerId?: string) {
  return useQuery<CustomerContactItem[]>({
    queryKey: ["customer-contacts", customerId],
    queryFn: () => apiClient<CustomerContactItem[]>(`/crm/contacts?customerId=${customerId}`),
    enabled: Boolean(customerId),
  });
}

export function useCreateCustomerContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CustomerContactItem>) =>
      apiClient<CustomerContactItem>("/crm/contacts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-contacts", variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useUpdateCustomerContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      customerId: string;
      data: Partial<CustomerContactItem>;
    }) =>
      apiClient<CustomerContactItem>(`/crm/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-contacts", variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useDeleteCustomerContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; customerId: string }) =>
      apiClient<{ message: string }>(`/crm/contacts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-contacts", variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

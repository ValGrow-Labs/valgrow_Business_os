import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CustomerItem } from "./useCustomers";

export interface CustomerSegmentItem {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  rules: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export function useCustomerSegments() {
  return useQuery<CustomerSegmentItem[]>({
    queryKey: ["customer-segments"],
    queryFn: () => apiClient<CustomerSegmentItem[]>("/crm/segments"),
  });
}

export function useCustomerSegment(id: string) {
  return useQuery<CustomerSegmentItem>({
    queryKey: ["customer-segment", id],
    queryFn: () => apiClient<CustomerSegmentItem>(`/crm/segments/${id}`),
    enabled: Boolean(id),
  });
}

export function useCustomerSegmentCustomers(id: string) {
  return useQuery<CustomerItem[]>({
    queryKey: ["customer-segment-customers", id],
    queryFn: () => apiClient<CustomerItem[]>(`/crm/segments/${id}/customers`),
    enabled: Boolean(id),
  });
}

export function useCreateCustomerSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; rules?: Record<string, any> }) =>
      apiClient<CustomerSegmentItem>("/crm/segments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
    },
  });
}

export function useDeleteCustomerSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/segments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
    },
  });
}

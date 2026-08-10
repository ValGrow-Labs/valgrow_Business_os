import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CrmTagItem {
  id: string;
  organizationId: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useCrmTags() {
  return useQuery<CrmTagItem[]>({
    queryKey: ["crm-tags"],
    queryFn: () => apiClient<CrmTagItem[]>("/crm/tags"),
  });
}

export function useCreateCrmTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      apiClient<CrmTagItem>("/crm/tags", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tags"] });
    },
  });
}

export function useDeleteCrmTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/tags/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tags"] });
    },
  });
}

export function useAssignCrmTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tagId: string;
      customerId?: string;
      leadId?: string;
      opportunityId?: string;
    }) =>
      apiClient<any>("/crm/tags/assign", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tags"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useUnassignCrmTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tagId: string;
      customerId?: string;
      leadId?: string;
      opportunityId?: string;
    }) =>
      apiClient<any>("/crm/tags/unassign", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tags"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

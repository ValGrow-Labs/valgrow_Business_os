import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface LeadSourceItem {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export function useLeadSources() {
  return useQuery<LeadSourceItem[]>({
    queryKey: ["lead-sources"],
    queryFn: () => apiClient<LeadSourceItem[]>("/crm/lead-sources"),
  });
}

export function useCreateLeadSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiClient<LeadSourceItem>("/crm/lead-sources", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
    },
  });
}

export function useDeleteLeadSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/lead-sources/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
    },
  });
}

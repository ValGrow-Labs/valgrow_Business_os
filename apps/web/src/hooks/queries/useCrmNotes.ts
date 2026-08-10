import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CrmNoteItem {
  id: string;
  organizationId: string;
  content: string;
  authorId: string;
  customerId: string | null;
  leadId: string | null;
  opportunityId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  author?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export function useCrmNotes(params?: {
  customerId?: string;
  leadId?: string;
  opportunityId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.customerId) queryParams.set("customerId", params.customerId);
  if (params?.leadId) queryParams.set("leadId", params.leadId);
  if (params?.opportunityId) queryParams.set("opportunityId", params.opportunityId);

  const url = `/crm/notes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  return useQuery<CrmNoteItem[]>({
    queryKey: ["crm-notes", params],
    queryFn: () => apiClient<CrmNoteItem[]>(url),
  });
}

export function useCreateCrmNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content: string;
      customerId?: string;
      leadId?: string;
      opportunityId?: string;
    }) =>
      apiClient<CrmNoteItem>("/crm/notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-notes"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
      queryClient.invalidateQueries({ queryKey: ["lead"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity"] });
    },
  });
}

export function useDeleteCrmNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/notes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-notes"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

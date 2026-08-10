import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CrmTaskItem {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  customerId: string | null;
  leadId: string | null;
  opportunityId: string | null;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;

  assignedTo?: { id: string; firstName: string; lastName: string; email: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export function useCrmTasks(params?: {
  customerId?: string;
  leadId?: string;
  opportunityId?: string;
  assignedToId?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.customerId) queryParams.set("customerId", params.customerId);
  if (params?.leadId) queryParams.set("leadId", params.leadId);
  if (params?.opportunityId) queryParams.set("opportunityId", params.opportunityId);
  if (params?.assignedToId) queryParams.set("assignedToId", params.assignedToId);
  if (params?.status) queryParams.set("status", params.status);

  const url = `/crm/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  return useQuery<CrmTaskItem[]>({
    queryKey: ["crm-tasks", params],
    queryFn: () => apiClient<CrmTaskItem[]>(url),
  });
}

export function useCreateCrmTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CrmTaskItem>) =>
      apiClient<CrmTaskItem>("/crm/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
      queryClient.invalidateQueries({ queryKey: ["lead"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity"] });
    },
  });
}

export function useUpdateCrmTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrmTaskItem> }) =>
      apiClient<CrmTaskItem>(`/crm/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useDeleteCrmTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/tasks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

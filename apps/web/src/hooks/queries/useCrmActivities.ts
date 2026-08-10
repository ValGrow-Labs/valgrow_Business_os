import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CrmActivityItem {
  id: string;
  organizationId: string;
  type: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK" | "FOLLOW_UP" | "DEMO" | "VISIT";
  subject: string;
  description: string | null;
  location: string | null;
  durationMinutes: number | null;
  activityDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  customerId: string | null;
  leadId: string | null;
  opportunityId: string | null;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  assignedTo?: { id: string; firstName: string; lastName: string; email: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export function useCrmActivities(params?: {
  customerId?: string;
  leadId?: string;
  opportunityId?: string;
  assignedToId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.customerId) queryParams.set("customerId", params.customerId);
  if (params?.leadId) queryParams.set("leadId", params.leadId);
  if (params?.opportunityId) queryParams.set("opportunityId", params.opportunityId);
  if (params?.assignedToId) queryParams.set("assignedToId", params.assignedToId);

  const url = `/crm/activities${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  return useQuery<CrmActivityItem[]>({
    queryKey: ["crm-activities", params],
    queryFn: () => apiClient<CrmActivityItem[]>(url),
  });
}

export function useCreateCrmActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CrmActivityItem>) =>
      apiClient<CrmActivityItem>("/crm/activities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
      queryClient.invalidateQueries({ queryKey: ["lead"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity"] });
    },
  });
}

export function useUpdateCrmActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrmActivityItem> }) =>
      apiClient<CrmActivityItem>(`/crm/activities/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useDeleteCrmActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/activities/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

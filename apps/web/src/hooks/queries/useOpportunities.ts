import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface OpportunityItem {
  id: string;
  organizationId: string;
  opportunityNumber: string;
  customerId: string;
  leadId: string | null;
  name: string;
  description: string | null;
  pipelineId: string;
  stageId: string;
  assignedToId: string | null;
  estimatedValue: number;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  status: "OPEN" | "WON" | "LOST" | "CANCELLED";
  closeReason: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  deletedAt: string | null;

  customer?: { id: string; customerCode: string; name: string } | null;
  lead?: { id: string; leadNumber: string; firstName: string; lastName: string | null } | null;
  pipeline?: { id: string; name: string } | null;
  stage?: { id: string; name: string; color: string | null; probability: number } | null;
  assignedTo?: { id: string; firstName: string; lastName: string; email: string } | null;
  quotations?: Array<{ id: string; quotationNumber: string; status: string; totalAmount: number }>;
  salesOrders?: Array<{ id: string; orderNumber: string; status: string; totalAmount: number }>;
  tags?: Array<{ id: string; tag: { id: string; name: string; color: string | null } }>;
}

export function useOpportunities(params?: {
  pipelineId?: string;
  stageId?: string;
  customerId?: string;
  assignedToId?: string;
  status?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.pipelineId) queryParams.set("pipelineId", params.pipelineId);
  if (params?.stageId) queryParams.set("stageId", params.stageId);
  if (params?.customerId) queryParams.set("customerId", params.customerId);
  if (params?.assignedToId) queryParams.set("assignedToId", params.assignedToId);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.search) queryParams.set("search", params.search);

  const url = `/crm/opportunities${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  return useQuery<OpportunityItem[]>({
    queryKey: ["opportunities", params],
    queryFn: () => apiClient<OpportunityItem[]>(url),
  });
}

export function useOpportunity(id: string) {
  return useQuery<OpportunityItem>({
    queryKey: ["opportunity", id],
    queryFn: () => apiClient<OpportunityItem>(`/crm/opportunities/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OpportunityItem>) =>
      apiClient<OpportunityItem>("/crm/opportunities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OpportunityItem> }) =>
      apiClient<OpportunityItem>(`/crm/opportunities/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useUpdateOpportunityStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        stageId: string;
        probability?: number;
        status?: "OPEN" | "WON" | "LOST" | "CANCELLED";
        closeReason?: string;
      };
    }) =>
      apiClient<OpportunityItem>(`/crm/opportunities/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/opportunities/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface LeadItem {
  id: string;
  organizationId: string;
  leadNumber: string;
  firstName: string;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sourceId: string | null;
  pipelineId: string | null;
  stageId: string | null;
  assignedToId: string | null;
  estimatedValue: number;
  currency: string;
  expectedCloseDate: string | null;
  notes: string | null;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED" | "LOST";
  convertedCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  convertedAt: string | null;
  deletedAt: string | null;

  source?: { id: string; name: string } | null;
  pipeline?: { id: string; name: string } | null;
  stage?: { id: string; name: string; color: string | null } | null;
  assignedTo?: { id: string; firstName: string; lastName: string; email: string } | null;
  convertedCustomer?: { id: string; customerCode: string; name: string } | null;
  tags?: Array<{ id: string; tag: { id: string; name: string; color: string | null } }>;
}

export function useLeads(params?: {
  status?: string;
  stageId?: string;
  assignedToId?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.stageId) queryParams.set("stageId", params.stageId);
  if (params?.assignedToId) queryParams.set("assignedToId", params.assignedToId);
  if (params?.search) queryParams.set("search", params.search);

  const url = `/crm/leads${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  return useQuery<LeadItem[]>({
    queryKey: ["leads", params],
    queryFn: () => apiClient<LeadItem[]>(url),
  });
}

export function useLead(id: string) {
  return useQuery<LeadItem>({
    queryKey: ["lead", id],
    queryFn: () => apiClient<LeadItem>(`/crm/leads/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeadItem>) =>
      apiClient<LeadItem>("/crm/leads", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeadItem> }) =>
      apiClient<LeadItem>(`/crm/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        existingCustomerId?: string;
        customerCode?: string;
        customerName?: string;
        taxIdNumber?: string;
        createOpportunity?: boolean;
        opportunityName?: string;
        pipelineId?: string;
        stageId?: string;
        estimatedValue?: number;
      };
    }) =>
      apiClient<{
        leadId: string;
        customerId: string;
        opportunityId: string | null;
        status: string;
      }>(`/crm/leads/${id}/convert`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["crm-notes"] });
      queryClient.invalidateQueries({ queryKey: ["customer-360"] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/leads/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

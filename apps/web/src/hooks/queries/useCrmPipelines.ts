import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface PipelineStageItem {
  id: string;
  organizationId: string;
  pipelineId: string;
  name: string;
  position: number;
  probability: number;
  color: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineItem {
  id: string;
  organizationId: string;
  name: string;
  type: "LEAD" | "OPPORTUNITY";
  isDefault: boolean;
  status: "ACTIVE" | "INACTIVE";
  stages: PipelineStageItem[];
  createdAt: string;
  updatedAt: string;
}

export function useCrmPipelines() {
  return useQuery<PipelineItem[]>({
    queryKey: ["crm-pipelines"],
    queryFn: () => apiClient<PipelineItem[]>("/crm/pipelines"),
  });
}

export function useCrmPipeline(id: string) {
  return useQuery<PipelineItem>({
    queryKey: ["crm-pipeline", id],
    queryFn: () => apiClient<PipelineItem>(`/crm/pipelines/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCrmPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type?: "LEAD" | "OPPORTUNITY"; isDefault?: boolean }) =>
      apiClient<PipelineItem>("/crm/pipelines", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipelines"] });
    },
  });
}

export function useUpdateCrmPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; isDefault?: boolean } }) =>
      apiClient<PipelineItem>(`/crm/pipelines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline", id] });
    },
  });
}

export function useDeleteCrmPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/crm/pipelines/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipelines"] });
    },
  });
}

export function useAddPipelineStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pipelineId,
      data,
    }: {
      pipelineId: string;
      data: { name: string; position?: number; probability?: number; color?: string };
    }) =>
      apiClient<PipelineStageItem>(`/crm/pipelines/${pipelineId}/stages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { pipelineId }) => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline", pipelineId] });
    },
  });
}

export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stageId,
      data,
    }: {
      stageId: string;
      data: { name?: string; position?: number; probability?: number; color?: string };
    }) =>
      apiClient<PipelineStageItem>(`/crm/pipelines/stages/${stageId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipelines"] });
    },
  });
}

export function useDeletePipelineStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stageId: string) =>
      apiClient<{ message: string }>(`/crm/pipelines/stages/${stageId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipelines"] });
    },
  });
}

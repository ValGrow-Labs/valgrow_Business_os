import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CostCenterItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export function useCostCenters() {
  return useQuery<CostCenterItem[]>({
    queryKey: ["cost-centers"],
    queryFn: () => apiClient<CostCenterItem[]>("/cost-centers"),
  });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; name: string; description?: string }) =>
      apiClient<CostCenterItem>("/cost-centers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
    },
  });
}

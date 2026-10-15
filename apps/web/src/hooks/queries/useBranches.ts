import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getActiveOrgId } from "@/lib/api-client";

export interface BranchItem {
  id: string;
  name: string;
  code: string | null;
  city: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export function useBranches(orgId?: string) {
  const effectiveOrgId = orgId || getActiveOrgId();
  return useQuery<BranchItem[]>({
    queryKey: ["branches", effectiveOrgId],
    queryFn: () => apiClient<BranchItem[]>("/branches"),
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BranchItem>) =>
      apiClient<BranchItem>("/branches", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

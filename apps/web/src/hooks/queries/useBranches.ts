import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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

export function useBranches() {
  return useQuery<BranchItem[]>({
    queryKey: ["branches"],
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

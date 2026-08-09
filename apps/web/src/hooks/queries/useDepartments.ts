import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DepartmentItem {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  branch?: { id: string; name: string } | null;
  head?: { id: string; firstName: string; lastName: string; email: string } | null;
  _count?: { teams: number };
}

export function useDepartments() {
  return useQuery<DepartmentItem[]>({
    queryKey: ["departments"],
    queryFn: () => apiClient<DepartmentItem[]>("/departments"),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DepartmentItem>) =>
      apiClient<DepartmentItem>("/departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

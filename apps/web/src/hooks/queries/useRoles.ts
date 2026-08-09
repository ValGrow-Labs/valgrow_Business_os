import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  scope: string;
  membersCount: number;
  permissions: string[];
  createdAt: string;
}

export function useRoles() {
  return useQuery<RoleItem[]>({
    queryKey: ["roles"],
    queryFn: () => apiClient<RoleItem[]>("/roles"),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; permissionIds?: string[] }) =>
      apiClient<RoleItem>("/roles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

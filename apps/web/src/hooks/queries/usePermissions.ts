import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface PermissionItem {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string | null;
}

export function usePermissions() {
  return useQuery<PermissionItem[]>({
    queryKey: ["permissions"],
    queryFn: () => apiClient<PermissionItem[]>("/permissions"),
    staleTime: 10 * 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ActivityLogItem {
  id: string;
  actor: string;
  actorEmail?: string;
  action: string;
  entity: string;
  target: string;
  status: string;
  createdAt: string;
}

export function useActivityLogs() {
  return useQuery<ActivityLogItem[]>({
    queryKey: ["activityLogs"],
    queryFn: () => apiClient<ActivityLogItem[]>("/activity-logs"),
  });
}

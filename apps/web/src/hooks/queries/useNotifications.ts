import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface NotificationItemData {
  id: string;
  title: string;
  body: string;
  kind: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  unread: boolean;
  createdAt: string;
}

export function useNotifications() {
  return useQuery<NotificationItemData[]>({
    queryKey: ["notifications"],
    queryFn: () => apiClient<NotificationItemData[]>("/notifications"),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

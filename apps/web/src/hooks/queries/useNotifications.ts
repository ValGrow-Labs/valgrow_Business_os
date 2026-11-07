import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface NotificationItemData {
  id: string;
  title: string;
  body: string;
  kind: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  unread: boolean;
  createdAt: string;
  metadata?: Record<string, any> | null | undefined;
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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationItemData[]>(["notifications"]);
      if (previous) {
        queryClient.setQueryData<NotificationItemData[]>(
          ["notifications"],
          previous.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient("/notifications/read-all", { method: "PATCH" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationItemData[]>(["notifications"]);
      if (previous) {
        queryClient.setQueryData<NotificationItemData[]>(
          ["notifications"],
          previous.map((n) => ({ ...n, unread: false })),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

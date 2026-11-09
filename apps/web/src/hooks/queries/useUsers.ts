import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getActiveOrgId } from "@/lib/api-client";

export interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  jobTitle: string | null;
  status: string;
  role: string;
  roleId: string;
  memberStatus: string;
  createdAt: string;
}

export function useUsers(
  orgId?: string,
  params?: { search?: string; status?: string; role?: string },
) {
  const effectiveOrgId = orgId || getActiveOrgId();
  const queryParams = new URLSearchParams();
  if (params?.search?.trim()) queryParams.set("search", params.search.trim());
  if (params?.status && params.status !== "ALL") queryParams.set("status", params.status);
  if (params?.role && params.role !== "ALL") queryParams.set("role", params.role);
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return useQuery<UserItem[]>({
    queryKey: ["users", effectiveOrgId, params?.search, params?.status, params?.role],
    queryFn: () => apiClient<UserItem[]>(`/users${qs}`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      firstName: string;
      lastName: string;
      roleId: string;
      jobTitle?: string | undefined;
      phone?: string | undefined;
    }) =>
      apiClient<UserItem>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export interface ResetPasswordResponse {
  success: boolean;
  action: "generate-link" | "set-temporary";
  message: string;
  resetUrl?: string;
  resetToken?: string;
  expiresAt?: string;
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      action: "generate-link" | "set-temporary";
      temporaryPassword?: string;
    }) =>
      apiClient<ResetPasswordResponse>(`/users/${data.userId}/reset-password`, {
        method: "POST",
        body: JSON.stringify({
          action: data.action,
          ...(data.temporaryPassword ? { temporaryPassword: data.temporaryPassword } : {}),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

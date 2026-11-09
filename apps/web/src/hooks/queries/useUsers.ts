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

export function useUsers(orgId?: string) {
  const effectiveOrgId = orgId || getActiveOrgId();
  return useQuery<UserItem[]>({
    queryKey: ["users", effectiveOrgId],
    queryFn: () => apiClient<UserItem[]>("/users"),
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, setActiveOrgId } from "@/lib/api-client";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (data) => {
      if (data?.activeOrganization?.id) {
        setActiveOrgId(data.activeOrganization.id);
      }
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationName: string;
    }) =>
      apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      if (data?.activeOrganization?.id) {
        setActiveOrgId(data.activeOrganization.id);
      }
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      setActiveOrgId(null);
      queryClient.clear();
    },
  });
}

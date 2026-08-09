import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  department?: { id: string; name: string } | null;
  lead?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export function useTeams() {
  return useQuery<TeamItem[]>({
    queryKey: ["teams"],
    queryFn: () => apiClient<TeamItem[]>("/teams"),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TeamItem>) =>
      apiClient<TeamItem>("/teams", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

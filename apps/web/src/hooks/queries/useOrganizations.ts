import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface OrganizationItem {
  id: string;
  name: string;
  legalName: string | null;
  slug: string;
  logo: string | null;
  plan: string;
  status: string;
  currency: string;
  timezone: string;
  role: string;
}

export function useOrganizations() {
  return useQuery<OrganizationItem[]>({
    queryKey: ["organizations"],
    queryFn: () => apiClient<OrganizationItem[]>("/organizations"),
    staleTime: 5 * 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiClient, setActiveOrgId } from "@/lib/api-client";

export interface UserMeResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    jobTitle: string | null;
    bio: string | null;
    status: string;
    createdAt: string;
  };
  activeOrganization: {
    id: string;
    name: string;
    legalName: string | null;
    slug: string;
    logo: string | null;
    plan: string;
    status: string;
    currency: string;
    timezone: string;
    fiscalYearStart: string;
  } | null;
  role: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  permissions: string[];
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    role: string;
  }>;
}

export function useCurrentUser() {
  return useQuery<UserMeResponse>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await apiClient<UserMeResponse>("/auth/me");
      if (res.activeOrganization?.id) {
        setActiveOrgId(res.activeOrganization.id);
      }
      return res;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

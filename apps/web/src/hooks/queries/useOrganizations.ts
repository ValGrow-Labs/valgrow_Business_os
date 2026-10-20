import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  country?: string | null | undefined;
  timezone: string;
  fiscalYearStart?: string | null | undefined;
  role: string;
}

export interface CreateBranchSetupInput {
  name: string;
  code?: string | undefined;
  city?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
}

export interface CreateWarehouseSetupInput {
  name: string;
  code: string;
  associateWithBranch?: boolean | undefined;
  address?: string | undefined;
  city?: string | undefined;
}

export interface CreateOrganizationInput {
  name: string;
  legalName?: string | undefined;
  currency?: string | undefined;
  country?: string | undefined;
  city?: string | undefined;
  timezone?: string | undefined;
  fiscalYearStart?: string | undefined;
  slug?: string | undefined;
  createBranch?: boolean | undefined;
  branch?: CreateBranchSetupInput | undefined;
  createWarehouse?: boolean | undefined;
  warehouse?: CreateWarehouseSetupInput | undefined;
}

export interface UpdateOrganizationInput {
  name?: string | undefined;
  legalName?: string | undefined;
  currency?: string | undefined;
  country?: string | undefined;
  city?: string | undefined;
  timezone?: string | undefined;
  fiscalYearStart?: string | undefined;
  plan?: string | undefined;
}

export interface CreatedOrganizationResult extends OrganizationItem {
  country?: string | null | undefined;
  branch?:
    | {
        id: string;
        name: string;
        code: string | null;
        city: string;
      }
    | null
    | undefined;
  warehouse?:
    | {
        id: string;
        name: string;
        code: string;
        branchId: string | null;
      }
    | null
    | undefined;
}

export function useOrganizations() {
  return useQuery<OrganizationItem[]>({
    queryKey: ["organizations"],
    queryFn: () => apiClient<OrganizationItem[]>("/organizations"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrganizationInput) =>
      apiClient<CreatedOrganizationResult>("/organizations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationInput }) =>
      apiClient<OrganizationItem>(`/organizations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

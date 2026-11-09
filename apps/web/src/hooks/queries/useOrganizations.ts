import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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

export interface BranchDetailSummary {
  id: string;
  name: string;
  code: string | null;
  city: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
}

export interface OrganizationDetail extends OrganizationItem {
  taxId?: string | null | undefined;
  registrationNumber?: string | null | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  website?: string | null | undefined;
  primaryAddress?: string | null | undefined;
  primaryCity?: string | null | undefined;
  primaryBranchName?: string | null | undefined;
  valuationMethod?: string | undefined;
  membershipStatus?: string | undefined;
  joinedAt?: string | undefined;
  memberCount?: number | undefined;
  branchCount?: number | undefined;
  warehouseCount?: number | undefined;
  branches?: BranchDetailSummary[] | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
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

export interface OrganizationParams {
  search?: string | undefined;
  status?: string | undefined;
}

export function useOrganizations(params?: OrganizationParams | undefined) {
  const queryParts: string[] = [];
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return useQuery<OrganizationItem[]>({
    queryKey: ["organizations", params?.status, params?.search],
    queryFn: () => apiClient<OrganizationItem[]>(`/organizations${queryString}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrganization(id: string | null | undefined) {
  return useQuery<OrganizationDetail>({
    queryKey: ["organization", id],
    queryFn: () => apiClient<OrganizationDetail>(`/organizations/${id}`),
    enabled: Boolean(id),
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

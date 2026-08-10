import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AccountItem {
  id: string;
  organizationId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountCategory: string;
  normalBalance: string;
  parentAccountId?: string | null;
  description?: string | null;
  isSystemAccount: boolean;
  isActive: boolean;
  reconciliationEnabled: boolean;
  parent?: AccountItem | null;
  children?: AccountItem[];
}

export interface AccountMappingItem {
  id: string;
  mappingKey: string;
  accountId: string;
  description?: string | null;
  account?: AccountItem;
}

export function useChartOfAccounts() {
  return useQuery<AccountItem[]>({
    queryKey: ["chart-of-accounts"],
    queryFn: () => apiClient<AccountItem[]>("/accounts"),
  });
}

export function useAccountMappings() {
  return useQuery<AccountMappingItem[]>({
    queryKey: ["account-mappings"],
    queryFn: () => apiClient<AccountMappingItem[]>("/accounts/mappings"),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      accountCode: string;
      accountName: string;
      accountType: string;
      accountCategory: string;
      normalBalance: string;
      parentAccountId?: string;
      description?: string;
    }) =>
      apiClient<AccountItem>("/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
    },
  });
}

export function useUpdateAccountMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { mappingKey: string; accountId: string; description?: string }) =>
      apiClient<AccountMappingItem>("/accounts/mappings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-mappings"] });
    },
  });
}

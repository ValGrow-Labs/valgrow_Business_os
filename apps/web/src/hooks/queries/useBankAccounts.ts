import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface BankAccountItem {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName?: string | null;
  ifscCode?: string | null;
  swiftCode?: string | null;
  accountType: string;
  accountId: string;
  openingBalance: number;
  status: string;
  account?: { id: string; accountCode: string; accountName: string };
}

export interface BankReconciliationItem {
  id: string;
  bankAccountId: string;
  statementDate: string;
  endingBalance: number;
  clearedBalance: number;
  isReconciled: boolean;
  notes?: string | null;
  bankAccount?: { id: string; accountName: string; accountNumber: string };
}

export function useBankAccounts() {
  return useQuery<BankAccountItem[]>({
    queryKey: ["bank-accounts"],
    queryFn: () => apiClient<BankAccountItem[]>("/bank-accounts"),
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      accountName: string;
      accountNumber: string;
      bankName: string;
      branchName?: string;
      ifscCode?: string;
      swiftCode?: string;
      accountType: string;
      accountId: string;
    }) =>
      apiClient<BankAccountItem>("/bank-accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

export function useBankReconciliations(bankAccountId?: string) {
  return useQuery<BankReconciliationItem[]>({
    queryKey: ["bank-reconciliations", bankAccountId],
    queryFn: () =>
      apiClient<BankReconciliationItem[]>(
        `/bank-accounts/reconciliations${bankAccountId ? `?bankAccountId=${bankAccountId}` : ""}`,
      ),
  });
}

export function useCreateBankReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      bankAccountId: string;
      statementDate: string;
      endingBalance: number;
      notes?: string;
    }) =>
      apiClient<BankReconciliationItem>("/bank-accounts/reconciliations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-reconciliations"] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SupplierBalanceItem {
  supplier: {
    id: string;
    name: string;
    code: string;
    email?: string | null;
    phone?: string | null;
  };
  totalOutstanding: number;
}

export interface SupplierAgingResult {
  summary: {
    current: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    daysOver90: number;
    total: number;
  };
  suppliers: {
    supplier: { id: string; name: string; code: string };
    current: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    daysOver90: number;
    total: number;
  }[];
}

export interface SupplierStatementResult {
  supplier: { id: string; name: string; code: string };
  statementPeriod: { startDate?: string; endDate?: string };
  closingBalance: number;
  transactions: {
    date: string;
    type: string;
    reference: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }[];
}

export function useSupplierBalances() {
  return useQuery<SupplierBalanceItem[]>({
    queryKey: ["ap-balances"],
    queryFn: () => apiClient<SupplierBalanceItem[]>("/accounts-payable/balances"),
  });
}

export function useSupplierAging(supplierId?: string) {
  return useQuery<SupplierAgingResult>({
    queryKey: ["ap-aging", supplierId],
    queryFn: () =>
      apiClient<SupplierAgingResult>(
        `/accounts-payable/aging${supplierId ? `?supplierId=${supplierId}` : ""}`,
      ),
  });
}

export function useSupplierStatement(supplierId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const q = params.toString();

  return useQuery<SupplierStatementResult>({
    queryKey: ["ap-statement", supplierId, startDate, endDate],
    queryFn: () =>
      apiClient<SupplierStatementResult>(
        `/accounts-payable/statement/${supplierId}${q ? `?${q}` : ""}`,
      ),
    enabled: Boolean(supplierId),
  });
}

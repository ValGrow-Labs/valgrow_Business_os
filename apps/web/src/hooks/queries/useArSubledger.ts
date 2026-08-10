import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CustomerBalanceItem {
  customer: {
    id: string;
    name: string;
    customerCode: string;
    email?: string | null;
    phone?: string | null;
  };
  totalOutstanding: number;
}

export interface CustomerAgingResult {
  summary: {
    current: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    daysOver90: number;
    total: number;
  };
  customers: {
    customer: { id: string; name: string; customerCode: string };
    current: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    daysOver90: number;
    total: number;
  }[];
}

export interface CustomerStatementResult {
  customer: { id: string; name: string; customerCode: string };
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

export function useCustomerBalances() {
  return useQuery<CustomerBalanceItem[]>({
    queryKey: ["ar-balances"],
    queryFn: () => apiClient<CustomerBalanceItem[]>("/accounts-receivable/balances"),
  });
}

export function useCustomerAging(customerId?: string) {
  return useQuery<CustomerAgingResult>({
    queryKey: ["ar-aging", customerId],
    queryFn: () =>
      apiClient<CustomerAgingResult>(
        `/accounts-receivable/aging${customerId ? `?customerId=${customerId}` : ""}`,
      ),
  });
}

export function useCustomerStatement(customerId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const q = params.toString();

  return useQuery<CustomerStatementResult>({
    queryKey: ["ar-statement", customerId, startDate, endDate],
    queryFn: () =>
      apiClient<CustomerStatementResult>(
        `/accounts-receivable/statement/${customerId}${q ? `?${q}` : ""}`,
      ),
    enabled: Boolean(customerId),
  });
}

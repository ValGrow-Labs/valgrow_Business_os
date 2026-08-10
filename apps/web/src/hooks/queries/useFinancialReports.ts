import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TrialBalanceResult {
  asOfDate: string;
  rows: {
    account: {
      id: string;
      accountCode: string;
      accountName: string;
      accountType: string;
      accountCategory: string;
      normalBalance: string;
    };
    debit: number;
    credit: number;
  }[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    balanced: boolean;
  };
}

export interface ProfitAndLossResult {
  period: { startDate?: string; endDate?: string };
  revenue: { items: { accountCode: string; accountName: string; amount: number }[]; total: number };
  cogs: { items: { accountCode: string; accountName: string; amount: number }[]; total: number };
  grossProfit: number;
  operatingExpenses: { items: { accountCode: string; accountName: string; amount: number }[]; total: number };
  netProfit: number;
}

export interface BalanceSheetResult {
  asOfDate: string;
  assets: { items: { accountCode: string; accountName: string; balance: number }[]; total: number };
  liabilities: { items: { accountCode: string; accountName: string; balance: number }[]; total: number };
  equity: { items: { accountCode: string; accountName: string; balance: number }[]; total: number };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface GeneralLedgerDetailResult {
  account: { id: string; accountCode: string; accountName: string; normalBalance: string };
  period: { startDate?: string; endDate?: string };
  totalLines: number;
  endingBalance: number;
  lines: {
    lineId: string;
    postingDate: string;
    journalNumber: string;
    sourceModule: string;
    referenceType: string;
    referenceId: string;
    description: string;
    debit: number;
    credit: number;
    runningBalance: number;
    customer?: { id: string; name: string } | null;
    supplier?: { id: string; name: string } | null;
  }[];
}

export function useTrialBalance(asOfDate?: string) {
  return useQuery<TrialBalanceResult>({
    queryKey: ["trial-balance", asOfDate],
    queryFn: () =>
      apiClient<TrialBalanceResult>(
        `/financial-reports/trial-balance${asOfDate ? `?asOfDate=${asOfDate}` : ""}`,
      ),
  });
}

export function useProfitAndLoss(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const q = params.toString();

  return useQuery<ProfitAndLossResult>({
    queryKey: ["profit-and-loss", startDate, endDate],
    queryFn: () => apiClient<ProfitAndLossResult>(`/financial-reports/profit-and-loss${q ? `?${q}` : ""}`),
  });
}

export function useBalanceSheet(asOfDate?: string) {
  return useQuery<BalanceSheetResult>({
    queryKey: ["balance-sheet", asOfDate],
    queryFn: () =>
      apiClient<BalanceSheetResult>(
        `/financial-reports/balance-sheet${asOfDate ? `?asOfDate=${asOfDate}` : ""}`,
      ),
  });
}

export function useGeneralLedgerDetail(accountId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const q = params.toString();

  return useQuery<GeneralLedgerDetailResult>({
    queryKey: ["general-ledger", accountId, startDate, endDate],
    queryFn: () =>
      apiClient<GeneralLedgerDetailResult>(
        `/financial-reports/general-ledger/${accountId}${q ? `?${q}` : ""}`,
      ),
    enabled: Boolean(accountId),
  });
}

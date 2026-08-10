import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AccountingPeriodItem {
  id: string;
  periodName: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: "OPEN" | "CLOSED" | "LOCKED";
}

export interface FiscalYearItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  periods: AccountingPeriodItem[];
}

export function useFiscalYears() {
  return useQuery<FiscalYearItem[]>({
    queryKey: ["fiscal-years"],
    queryFn: () => apiClient<FiscalYearItem[]>("/fiscal-years"),
  });
}

export function useAccountingPeriods(fiscalYearId?: string) {
  return useQuery<AccountingPeriodItem[]>({
    queryKey: ["accounting-periods", fiscalYearId],
    queryFn: () =>
      apiClient<AccountingPeriodItem[]>(
        `/accounting-periods${fiscalYearId ? `?fiscalYearId=${fiscalYearId}` : ""}`,
      ),
  });
}

export function useCreateFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string }) =>
      apiClient<FiscalYearItem>("/fiscal-years", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-years"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-periods"] });
    },
  });
}

export function useUpdatePeriodStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "CLOSED" | "LOCKED" }) =>
      apiClient<AccountingPeriodItem>(`/accounting-periods/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-years"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-periods"] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TaxSummaryResult {
  period: { startDate?: string; endDate?: string };
  totalOutputTaxCollected: number;
  totalInputTaxClaimed: number;
  netTaxPayable: number;
  netTaxRefundable: number;
}

export function useTaxSummary(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const q = params.toString();

  return useQuery<TaxSummaryResult>({
    queryKey: ["tax-summary", startDate, endDate],
    queryFn: () => apiClient<TaxSummaryResult>(`/tax-reports/summary${q ? `?${q}` : ""}`),
  });
}

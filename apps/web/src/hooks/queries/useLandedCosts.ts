import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface LandedCostItem {
  id: string;
  organizationId: string;
  goodsReceiptId: string;
  costType: "FREIGHT" | "CUSTOMS" | "INSURANCE" | "DUTY" | "OTHER";
  amount: number;
  notes: string | null;
  createdAt: string;
  goodsReceipt?: { id: string; receiptNumber: string; status: string };
}

export function useLandedCosts() {
  return useQuery<LandedCostItem[]>({
    queryKey: ["landed-costs"],
    queryFn: () => apiClient<LandedCostItem[]>("/landed-costs"),
  });
}

export function useLandedCost(id: string) {
  return useQuery<LandedCostItem>({
    queryKey: ["landed-cost", id],
    queryFn: () => apiClient<LandedCostItem>(`/landed-costs/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateLandedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      goodsReceiptId: string;
      costType: "FREIGHT" | "CUSTOMS" | "INSURANCE" | "DUTY" | "OTHER";
      amount: number;
      notes?: string | undefined;
    }) =>
      apiClient<LandedCostItem>("/landed-costs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landed-costs"] });
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

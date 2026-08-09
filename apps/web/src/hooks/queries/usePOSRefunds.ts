import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface POSRefundDto {
  notes?: string;
  items?: {
    productId: string;
    variantId?: string;
    locationId: string;
    quantity: number;
  }[];
}

export function useRefundPOSSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ saleId, dto }: { saleId: string; dto: POSRefundDto }) =>
      apiClient<any>(`/pos/sales/${saleId}/refund`, {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      queryClient.invalidateQueries({ queryKey: ["pos-sale", variables.saleId] });
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["sales-returns"] });
    },
  });
}

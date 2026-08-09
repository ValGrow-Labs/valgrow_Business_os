import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ProductPriceItem {
  id: string;
  organizationId: string;
  productId: string;
  variantId: string | null;
  tier: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  price: number | string;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
  variant?: { id: string; name: string; sku: string } | null;
}

export function useProductPrices(productId: string) {
  return useQuery<ProductPriceItem[]>({
    queryKey: ["productPrices", productId],
    queryFn: () => apiClient<ProductPriceItem[]>(`/products/${productId}/prices`),
    enabled: Boolean(productId),
  });
}

export function useCreatePrice(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductPriceItem>) =>
      apiClient<ProductPriceItem>(`/products/${productId}/prices`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productPrices", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdatePrice(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductPriceItem> }) =>
      apiClient<ProductPriceItem>(`/products/${productId}/prices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productPrices", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
}

export function useDeletePrice(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/products/${productId}/prices/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productPrices", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
}

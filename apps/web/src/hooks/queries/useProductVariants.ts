import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ProductVariantItem {
  id: string;
  organizationId: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string | null;
  attributes: any;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  priceLevels?: any[];
}

export function useProductVariants(productId?: string) {
  return useQuery<ProductVariantItem[]>({
    queryKey: ["productVariants", productId],
    queryFn: () =>
      apiClient<ProductVariantItem[]>(
        productId ? `/products/${productId}/variants` : "/product-variants",
      ),
  });
}

export function useCreateVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductVariantItem>) =>
      apiClient<ProductVariantItem>(`/products/${productId}/variants`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductVariantItem> }) =>
      apiClient<ProductVariantItem>(`/products/${productId}/variants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
}

export function useDeleteVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/products/${productId}/variants/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
}

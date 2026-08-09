import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ProductItem {
  id: string;
  organizationId: string;
  categoryId: string | null;
  brandId: string | null;
  unitId: string | null;
  taxId: string | null;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  type: "PHYSICAL" | "SERVICE" | "DIGITAL";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  costPrice: number | string;
  hasVariants: boolean;
  images: any;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string; logo: string | null } | null;
  unit?: { id: string; name: string; code: string; allowDecimals: boolean } | null;
  tax?: { id: string; name: string; rate: number | string; isInclusive: boolean } | null;
  variants?: any[];
  priceLevels?: any[];
}

export interface ProductsResponse {
  data: ProductItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useProducts(params?: ProductParams) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.search) queryParams.set("search", params.search);
  if (params?.categoryId) queryParams.set("categoryId", params.categoryId);
  if (params?.brandId) queryParams.set("brandId", params.brandId);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.type) queryParams.set("type", params.type);
  if (params?.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.set("sortOrder", params.sortOrder);

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<ProductsResponse>({
    queryKey: ["products", params],
    queryFn: () => apiClient<ProductsResponse>(`/products${queryStr}`),
  });
}

export function useProduct(id: string) {
  return useQuery<ProductItem>({
    queryKey: ["product", id],
    queryFn: () => apiClient<ProductItem>(`/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductItem>) =>
      apiClient<ProductItem>("/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductItem> }) =>
      apiClient<ProductItem>(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

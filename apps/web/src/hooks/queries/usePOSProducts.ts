import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface POSProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  costPrice: number;
  retailPrice?: number;
  availableStock?: number;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  unit?: { id: string; name: string; code: string } | null;
  tax?: { id: string; name: string; rate: number; isInclusive: boolean } | null;
  variants?: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    prices?: { price: number }[];
  }[];
}

export interface POSProductSearchResult {
  data: POSProductItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface POSBarcodeResult {
  product: POSProductItem;
  variant: { id: string; name: string; sku: string; barcode: string | null } | null;
  price: number;
}

export function usePOSProductSearch(params: {
  search?: string | undefined;
  categoryId?: string | undefined;
  brandId?: string | undefined;
  warehouseId?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.categoryId) queryParams.append("categoryId", params.categoryId);
  if (params.brandId) queryParams.append("brandId", params.brandId);
  if (params.warehouseId) queryParams.append("warehouseId", params.warehouseId);
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));

  const qStr = queryParams.toString();

  return useQuery<POSProductSearchResult>({
    queryKey: [
      "pos-products",
      params.search,
      params.categoryId,
      params.brandId,
      params.warehouseId,
      params.page,
      params.limit,
    ],
    queryFn: () =>
      apiClient<POSProductSearchResult>(`/pos/products/search${qStr ? `?${qStr}` : ""}`),
  });
}

export async function findPOSProductByBarcode(code: string): Promise<POSBarcodeResult | null> {
  if (!code || !code.trim()) return null;
  return apiClient<POSBarcodeResult | null>(
    `/pos/products/barcode/${encodeURIComponent(code.trim())}`,
  );
}

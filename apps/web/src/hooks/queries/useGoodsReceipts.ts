import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface GoodsReceiptItemData {
  id?: string;
  purchaseOrderItemId: string;
  productId: string;
  variantId?: string | null;
  locationId: string;
  batchNumber?: string | null;
  manufactureDate?: string | null;
  expiryDate?: string | null;
  receivedQty: number;
  rejectedQty?: number;
  unitCost: number;
  totalCost?: number;
  product?: { id: string; name: string; sku: string };
  variant?: { id: string; name: string; sku: string } | null;
  location?: { id: string; name: string; code: string };
}

export interface GoodsReceiptItem {
  id: string;
  organizationId: string;
  receiptNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  warehouseId: string;
  receivedById: string;
  referenceNumber: string | null;
  receivedAt: string;
  notes: string | null;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  createdAt: string;
  purchaseOrder?: { id: string; orderNumber: string };
  supplier?: { id: string; name: string; code: string };
  warehouse?: { id: string; name: string; code: string };
  receivedBy?: { id: string; firstName: string; lastName: string };
  items: GoodsReceiptItemData[];
  landedCostAllocations?: any[];
}

export function useGoodsReceipts(status?: string | undefined) {
  return useQuery<GoodsReceiptItem[]>({
    queryKey: ["goods-receipts", status],
    queryFn: () =>
      apiClient<GoodsReceiptItem[]>(`/goods-receipts${status ? `?status=${status}` : ""}`),
  });
}

export function useGoodsReceipt(id: string) {
  return useQuery<GoodsReceiptItem>({
    queryKey: ["goods-receipt", id],
    queryFn: () => apiClient<GoodsReceiptItem>(`/goods-receipts/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      purchaseOrderId: string;
      supplierId: string;
      warehouseId: string;
      receivedDate?: string | undefined;
      notes?: string | undefined;
      items: {
        purchaseOrderItemId: string;
        productId: string;
        variantId?: string | undefined;
        locationId: string;
        batchNumber?: string | undefined;
        manufactureDate?: string | undefined;
        expiryDate?: string | undefined;
        receivedQty: number;
        rejectedQty?: number | undefined;
        unitCost: number;
        serialNumbers?: string[] | undefined;
      }[];
    }) =>
      apiClient<GoodsReceiptItem>("/goods-receipts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}

export function usePostGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<GoodsReceiptItem>(`/goods-receipts/${id}/post`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["goods-receipt", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useCancelGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<GoodsReceiptItem>(`/goods-receipts/${id}/cancel`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["goods-receipt", id] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface PurchaseOrderItemData {
  id?: string;
  productId: string;
  variantId?: string | null;
  orderedQty: number;
  receivedQty?: number;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  product?: { id: string; name: string; sku: string };
  variant?: { id: string; name: string; sku: string } | null;
}

export interface PurchaseOrderItem {
  id: string;
  organizationId: string;
  orderNumber: string;
  supplierId: string;
  purchaseRequestId: string | null;
  branchId: string | null;
  warehouseId: string;
  currency: string;
  exchangeRate: number;
  orderDate: string;
  expectedDeliveryDate: string | null;
  paymentTerms: string | null;
  notes: string | null;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status:
    "DRAFT" | "SUBMITTED" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  supplier?: { id: string; name: string; code: string };
  purchaseRequest?: { id: string; requestNumber: string } | null;
  warehouse?: { id: string; name: string; code: string };
  items: PurchaseOrderItemData[];
  goodsReceipts?: { id: string; receiptNumber: string; status: string }[];
}

export function usePurchaseOrders(status?: string) {
  return useQuery<PurchaseOrderItem[]>({
    queryKey: ["purchase-orders", status],
    queryFn: () =>
      apiClient<PurchaseOrderItem[]>(`/purchase-orders${status ? `?status=${status}` : ""}`),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery<PurchaseOrderItem>({
    queryKey: ["purchase-order", id],
    queryFn: () => apiClient<PurchaseOrderItem>(`/purchase-orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      supplierId: string;
      purchaseRequestId?: string | undefined;
      branchId?: string | undefined;
      warehouseId?: string | undefined;
      currency?: string | undefined;
      exchangeRate?: number | undefined;
      orderDate?: string | undefined;
      expectedDeliveryDate?: string | undefined;
      paymentTerms?: string | undefined;
      notes?: string | undefined;
      items: {
        productId: string;
        variantId?: string | undefined;
        orderedQty: number;
        unitPrice: number;
        taxRate?: number | undefined;
        discountAmount?: number | undefined;
      }[];
    }) =>
      apiClient<PurchaseOrderItem>("/purchase-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient<PurchaseOrderItem>(`/purchase-orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    },
  });
}

export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<PurchaseOrderItem>(`/purchase-orders/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<PurchaseOrderItem>(`/purchase-orders/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    },
  });
}

export function useSendPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<PurchaseOrderItem>(`/purchase-orders/${id}/send`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    },
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<PurchaseOrderItem>(`/purchase-orders/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    },
  });
}

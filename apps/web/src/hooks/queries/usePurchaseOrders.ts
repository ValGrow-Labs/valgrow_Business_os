import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SupplierDetail {
  id: string;
  name: string;
  code: string;
  contactPerson?: string | null | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  address?: string | null | undefined;
  city?: string | null | undefined;
  state?: string | null | undefined;
  country?: string | null | undefined;
  taxIdNumber?: string | null | undefined;
}

export interface PurchaseOrderItemData {
  id?: string | undefined;
  productId: string;
  variantId?: string | null | undefined;
  orderedQty: number;
  receivedQty?: number | undefined;
  unitPrice: number;
  taxRate?: number | undefined;
  taxAmount?: number | undefined;
  discountAmount?: number | undefined;
  totalAmount?: number | undefined;
  product?: {
    id: string;
    name: string;
    sku: string;
    description?: string | null | undefined;
    unit?: { name: string; code: string } | null | undefined;
  } | undefined;
  variant?: { id: string; name: string; sku: string } | null | undefined;
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
    | "DRAFT"
    | "SUBMITTED"
    | "APPROVED"
    | "SENT"
    | "PARTIALLY_RECEIVED"
    | "RECEIVED"
    | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  supplier?: SupplierDetail | undefined;
  purchaseRequest?: { id: string; requestNumber: string } | null | undefined;
  warehouse?: {
    id: string;
    name: string;
    code: string;
    city?: string | null | undefined;
    address?: string | null | undefined;
    branch?: { id: string; name: string; code: string } | null | undefined;
  } | undefined;
  items: PurchaseOrderItemData[];
  goodsReceipts?: { id: string; receiptNumber: string; status: string }[] | undefined;
}

export interface PurchaseOrderParams {
  status?: string | undefined;
  search?: string | undefined;
  supplierId?: string | undefined;
}

export function usePurchaseOrders(params?: PurchaseOrderParams | string) {
  const normalizedParams = typeof params === "string" ? { status: params } : params;
  const queryParams = new URLSearchParams();
  if (normalizedParams?.status && normalizedParams.status !== "ALL") {
    queryParams.set("status", normalizedParams.status);
  }
  if (normalizedParams?.search) {
    queryParams.set("search", normalizedParams.search);
  }
  if (normalizedParams?.supplierId && normalizedParams.supplierId !== "ALL") {
    queryParams.set("supplierId", normalizedParams.supplierId);
  }
  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useQuery<PurchaseOrderItem[]>({
    queryKey: ["purchase-orders", normalizedParams],
    queryFn: () => apiClient<PurchaseOrderItem[]>(`/purchase-orders${queryStr}`),
    placeholderData: keepPreviousData,
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

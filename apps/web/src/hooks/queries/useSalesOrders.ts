import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SalesOrderItemData {
  id?: string;
  productId: string;
  variantId?: string | null;
  orderedQty: number;
  deliveredQty?: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  product?: { id: string; name: string; sku: string };
  variant?: { id: string; name: string; sku: string } | null;
}

export interface SalesOrderItem {
  id: string;
  organizationId: string;
  orderNumber: string;
  customerId: string;
  quotationId: string | null;
  branchId: string | null;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  currency: string;
  exchangeRate: number;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: string | null;
  notes: string | null;
  status: "DRAFT" | "CONFIRMED" | "PROCESSING" | "PARTIALLY_DELIVERED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; customerCode: string };
  quotation?: { id: string; quotationNumber: string } | null;
  warehouse?: { id: string; name: string; code: string };
  items: SalesOrderItemData[];
  deliveryNotes?: { id: string; deliveryNumber: string; status: string }[];
  salesInvoices?: { id: string; invoiceNumber: string; status: string }[];
}

export function useSalesOrders(status?: string) {
  return useQuery<SalesOrderItem[]>({
    queryKey: ["sales-orders", status],
    queryFn: () => apiClient<SalesOrderItem[]>(`/sales-orders${status ? `?status=${status}` : ""}`),
  });
}

export function useSalesOrder(id: string) {
  return useQuery<SalesOrderItem>({
    queryKey: ["sales-order", id],
    queryFn: () => apiClient<SalesOrderItem>(`/sales-orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerId: string;
      warehouseId: string;
      quotationId?: string | undefined;
      branchId?: string | undefined;
      orderDate?: string | undefined;
      expectedDeliveryDate?: string | undefined;
      currency?: string | undefined;
      exchangeRate?: number | undefined;
      paymentTerms?: string | undefined;
      notes?: string | undefined;
      items: {
        productId: string;
        variantId?: string | undefined;
        orderedQty: number;
        unitPrice: number;
        discountAmount?: number | undefined;
        taxRate?: number | undefined;
      }[];
    }) =>
      apiClient<SalesOrderItem>("/sales-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient<SalesOrderItem>(`/sales-orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
    },
  });
}

export function useConfirmSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<SalesOrderItem>(`/sales-orders/${id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
    },
  });
}

export function useProcessSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<SalesOrderItem>(`/sales-orders/${id}/process`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
    },
  });
}

export function useCancelSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<SalesOrderItem>(`/sales-orders/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
    },
  });
}

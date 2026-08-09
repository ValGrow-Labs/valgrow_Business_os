import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SalesReturnItemData {
  id?: string;
  productId: string;
  variantId?: string | null;
  locationId: string;
  originalQty: number;
  returnedQty: number;
  reason?: string;
  condition?: string;
  refundAmount: number;
  product?: { id: string; name: string; sku: string };
  variant?: { id: string; name: string; sku: string } | null;
  location?: { id: string; name: string; code: string };
}

export interface SalesReturnItem {
  id: string;
  organizationId: string;
  returnNumber: string;
  customerId: string;
  salesOrderId: string | null;
  salesInvoiceId: string | null;
  warehouseId: string;
  returnDate: string;
  totalRefundAmount: number;
  notes: string | null;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; customerCode: string };
  warehouse?: { id: string; name: string; code: string };
  salesOrder?: { id: string; orderNumber: string } | null;
  salesInvoice?: { id: string; invoiceNumber: string } | null;
  items: SalesReturnItemData[];
  creditNotes?: any[];
}

export function useSalesReturns(status?: string) {
  return useQuery<SalesReturnItem[]>({
    queryKey: ["sales-returns", status],
    queryFn: () =>
      apiClient<SalesReturnItem[]>(`/sales-returns${status ? `?status=${status}` : ""}`),
  });
}

export function useSalesReturn(id: string) {
  return useQuery<SalesReturnItem>({
    queryKey: ["sales-return", id],
    queryFn: () => apiClient<SalesReturnItem>(`/sales-returns/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerId: string;
      warehouseId: string;
      salesOrderId?: string | undefined;
      salesInvoiceId?: string | undefined;
      returnDate?: string | undefined;
      notes?: string | undefined;
      items: {
        productId: string;
        variantId?: string | undefined;
        locationId: string;
        originalQty: number;
        returnedQty: number;
        reason?: string | undefined;
        condition?: string | undefined;
        refundAmount: number;
      }[];
    }) =>
      apiClient<SalesReturnItem>("/sales-returns", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-returns"] });
    },
  });
}

export function usePostSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<SalesReturnItem>(`/sales-returns/${id}/post`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sales-returns"] });
      queryClient.invalidateQueries({ queryKey: ["sales-return", id] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
  });
}

export function useCancelSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<SalesReturnItem>(`/sales-returns/${id}/cancel`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sales-returns"] });
      queryClient.invalidateQueries({ queryKey: ["sales-return", id] });
    },
  });
}

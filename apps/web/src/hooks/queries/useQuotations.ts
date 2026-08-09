import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface QuotationItemData {
  id?: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  product?: { id: string; name: string; sku: string };
  variant?: { id: string; name: string; sku: string } | null;
}

export interface QuotationItem {
  id: string;
  organizationId: string;
  quotationNumber: string;
  customerId: string;
  branchId: string | null;
  warehouseId: string;
  quotationDate: string;
  expiryDate: string | null;
  currency: string;
  exchangeRate: number;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED" | "CANCELLED";
  convertedSalesOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; customerCode: string };
  warehouse?: { id: string; name: string; code: string };
  items: QuotationItemData[];
  convertedSalesOrder?: { id: string; orderNumber: string } | null;
}

export function useQuotations(status?: string) {
  return useQuery<QuotationItem[]>({
    queryKey: ["quotations", status],
    queryFn: () => apiClient<QuotationItem[]>(`/quotations${status ? `?status=${status}` : ""}`),
  });
}

export function useQuotation(id: string) {
  return useQuery<QuotationItem>({
    queryKey: ["quotation", id],
    queryFn: () => apiClient<QuotationItem>(`/quotations/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerId: string;
      warehouseId: string;
      branchId?: string | undefined;
      quotationDate?: string | undefined;
      expiryDate?: string | undefined;
      currency?: string | undefined;
      exchangeRate?: number | undefined;
      notes?: string | undefined;
      items: {
        productId: string;
        variantId?: string | undefined;
        quantity: number;
        unitPrice: number;
        discountAmount?: number | undefined;
        taxRate?: number | undefined;
      }[];
    }) =>
      apiClient<QuotationItem>("/quotations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient<QuotationItem>(`/quotations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
  });
}

export function useSendQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<QuotationItem>(`/quotations/${id}/send`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
  });
}

export function useAcceptQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<QuotationItem>(`/quotations/${id}/accept`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
  });
}

export function useRejectQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<QuotationItem>(`/quotations/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
  });
}

export function useExpireQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<QuotationItem>(`/quotations/${id}/expire`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
  });
}

export function useCancelQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<QuotationItem>(`/quotations/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    },
  });
}

export function useConvertQuotationToSO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<any>(`/quotations/${id}/convert`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
  });
}

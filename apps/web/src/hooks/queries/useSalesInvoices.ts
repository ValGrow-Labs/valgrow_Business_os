import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SalesInvoiceItemData {
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

export interface SalesInvoiceItem {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerId: string;
  salesOrderId: string | null;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: "DRAFT" | "POSTED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; customerCode: string };
  salesOrder?: { id: string; orderNumber: string } | null;
  items: SalesInvoiceItemData[];
  customerPayments?: any[];
  salesReturns?: any[];
  salesCreditNotes?: any[];
}

export function useSalesInvoices(status?: string) {
  return useQuery<SalesInvoiceItem[]>({
    queryKey: ["sales-invoices", status],
    queryFn: () =>
      apiClient<SalesInvoiceItem[]>(`/sales-invoices${status ? `?status=${status}` : ""}`),
  });
}

export function useSalesInvoice(id: string) {
  return useQuery<SalesInvoiceItem>({
    queryKey: ["sales-invoice", id],
    queryFn: () => apiClient<SalesInvoiceItem>(`/sales-invoices/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerId: string;
      salesOrderId?: string | undefined;
      invoiceDate?: string | undefined;
      dueDate: string;
      currency?: string | undefined;
      exchangeRate?: number | undefined;
      items: {
        productId: string;
        variantId?: string | undefined;
        quantity: number;
        unitPrice: number;
        discountAmount?: number | undefined;
        taxRate?: number | undefined;
      }[];
    }) =>
      apiClient<SalesInvoiceItem>("/sales-invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
    },
  });
}

export function useUpdateSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient<SalesInvoiceItem>(`/sales-invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["sales-invoice", id] });
    },
  });
}

export function usePostSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<SalesInvoiceItem>(`/sales-invoices/${id}/post`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["sales-invoice", id] });
    },
  });
}

export function useCancelSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<SalesInvoiceItem>(`/sales-invoices/${id}/cancel`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["sales-invoice", id] });
    },
  });
}

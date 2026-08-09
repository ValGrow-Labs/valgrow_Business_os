import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SupplierInvoiceItem {
  id: string;
  organizationId: string;
  supplierId: string;
  purchaseOrderId: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  supplier?: { id: string; name: string; code: string };
  purchaseOrder?: { id: string; orderNumber: string; totalAmount?: number; items?: any[] } | null;
  payments?: { id: string; amount: number; paymentDate: string }[];
}

export interface ThreeWayMatchResult {
  matched: boolean;
  mismatches: string[];
  summary?: {
    poTotal: number;
    invoiceTotal: number;
    totalOrdered: number;
    totalReceived: number;
  };
}

export function useSupplierInvoices() {
  return useQuery<SupplierInvoiceItem[]>({
    queryKey: ["supplier-invoices"],
    queryFn: () => apiClient<SupplierInvoiceItem[]>("/supplier-invoices"),
  });
}

export function useSupplierInvoice(id: string) {
  return useQuery<SupplierInvoiceItem>({
    queryKey: ["supplier-invoice", id],
    queryFn: () => apiClient<SupplierInvoiceItem>(`/supplier-invoices/${id}`),
    enabled: Boolean(id),
  });
}

export function useThreeWayMatch(id: string) {
  return useQuery<ThreeWayMatchResult>({
    queryKey: ["supplier-invoice-match", id],
    queryFn: () => apiClient<ThreeWayMatchResult>(`/supplier-invoices/${id}/three-way-match`),
    enabled: Boolean(id),
  });
}

export function useCreateSupplierInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      supplierId: string;
      purchaseOrderId?: string | undefined;
      invoiceNumber: string;
      invoiceDate: string;
      dueDate: string;
      currency?: string | undefined;
      exchangeRate?: number | undefined;
      subtotalAmount: number;
      taxAmount?: number | undefined;
      totalAmount: number;
    }) =>
      apiClient<SupplierInvoiceItem>("/supplier-invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-invoices"] });
    },
  });
}

export function useUpdateSupplierInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierInvoiceItem> }) =>
      apiClient<SupplierInvoiceItem>(`/supplier-invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-invoice", id] });
    },
  });
}

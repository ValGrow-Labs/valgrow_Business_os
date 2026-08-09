import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SupplierPaymentItem {
  id: string;
  organizationId: string;
  paymentNumber: string;
  supplierId: string;
  supplierInvoiceId: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "UPI";
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  supplier?: { id: string; name: string; code: string };
  invoice?: { id: string; invoiceNumber: string; totalAmount?: number; paidAmount?: number } | null;
}

export function useSupplierPayments() {
  return useQuery<SupplierPaymentItem[]>({
    queryKey: ["supplier-payments"],
    queryFn: () => apiClient<SupplierPaymentItem[]>("/supplier-payments"),
  });
}

export function useSupplierPayment(id: string) {
  return useQuery<SupplierPaymentItem>({
    queryKey: ["supplier-payment", id],
    queryFn: () => apiClient<SupplierPaymentItem>(`/supplier-payment/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      supplierId: string;
      supplierInvoiceId?: string | undefined;
      amount: number;
      paymentDate?: string | undefined;
      paymentMethod?: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "UPI" | undefined;
      referenceNumber?: string | undefined;
      notes?: string | undefined;
    }) =>
      apiClient<SupplierPaymentItem>("/supplier-payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-invoices"] });
    },
  });
}

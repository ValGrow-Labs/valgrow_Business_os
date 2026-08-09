import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CustomerPaymentItem {
  id: string;
  organizationId: string;
  paymentNumber: string;
  customerId: string;
  salesInvoiceId: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CREDIT_CARD" | "CHECK" | "ONLINE" | "OTHER";
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; customerCode: string };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
  } | null;
}

export function useCustomerPayments(customerId?: string) {
  return useQuery<CustomerPaymentItem[]>({
    queryKey: ["customer-payments", customerId],
    queryFn: () =>
      apiClient<CustomerPaymentItem[]>(
        `/customer-payments${customerId ? `?customerId=${customerId}` : ""}`,
      ),
  });
}

export function useCustomerPayment(id: string) {
  return useQuery<CustomerPaymentItem>({
    queryKey: ["customer-payment", id],
    queryFn: () => apiClient<CustomerPaymentItem>(`/customer-payments/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerId: string;
      salesInvoiceId?: string | undefined;
      amount: number;
      paymentDate?: string | undefined;
      paymentMethod?: string | undefined;
      referenceNumber?: string | undefined;
      notes?: string | undefined;
    }) =>
      apiClient<CustomerPaymentItem>("/customer-payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
    },
  });
}

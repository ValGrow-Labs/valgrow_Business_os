import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type CustomerPaymentMethod =
  "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI" | "BANK_TRANSFER" | "OTHER";

export interface POSPaymentItemDto {
  paymentMethod: CustomerPaymentMethod;
  amount: number;
  receivedAmount?: number | undefined;
  referenceNumber?: string | undefined;
}

export interface POSCheckoutDto {
  sessionId: string;
  cartId: string;
  customerId?: string | undefined;
  payments: POSPaymentItemDto[];
  cartDiscountAmount?: number | undefined;
  notes?: string | undefined;
}

export interface POSSaleResult {
  sale: {
    id: string;
    receiptNumber: string;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    changeAmount: number;
    status: string;
    createdAt: string;
    payments: {
      id: string;
      paymentMethod: CustomerPaymentMethod;
      amount: number;
      receivedAmount: number | null;
      changeAmount: number | null;
      referenceNumber: string | null;
    }[];
    customer?: { id: string; name: string; customerCode: string } | null;
    cashier?: { id: string; firstName: string; lastName: string } | null;
    branch?: { id: string; name: string; code: string | null } | null;
    warehouse?: { id: string; name: string; code: string } | null;
  };
  salesOrder: any;
  salesInvoice: any;
  deliveryNote: any;
  cartItems: any[];
}

export function usePOSCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: POSCheckoutDto) =>
      apiClient<POSSaleResult>("/pos/checkout", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries as per Requirement 10
      queryClient.invalidateQueries({ queryKey: ["pos-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["pos-session", variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["pos-cart", variables.cartId] });
      queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
    },
  });
}

export function usePOSSales(sessionId?: string) {
  return useQuery<POSSaleResult["sale"][]>({
    queryKey: ["pos-sales", sessionId],
    queryFn: () =>
      apiClient<POSSaleResult["sale"][]>(`/pos/sales${sessionId ? `?sessionId=${sessionId}` : ""}`),
  });
}

export function usePOSSale(id: string) {
  return useQuery<any>({
    queryKey: ["pos-sale", id],
    queryFn: () => apiClient<any>(`/pos/sales/${id}`),
    enabled: Boolean(id),
  });
}

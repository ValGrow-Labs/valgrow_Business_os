import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type CustomerPaymentMethod =
  "CASH" | "CREDIT_CARD" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "OTHER";

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
      queryClient.invalidateQueries({ queryKey: ["pos-payment-queue"] });
      queryClient.invalidateQueries({ queryKey: ["pos-billing-queue"] });
    },
  });
}

export interface PosSalesFilters {
  sessionId?: string;
  branchId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface POSSaleRecord {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  sessionId: string;
  cartId?: string | null;
  salesOrderId?: string | null;
  salesInvoiceId?: string | null;
  receiptNumber: string;
  customerId?: string | null;
  cashierId: string;
  subtotalAmount: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  changeAmount: number | string;
  status: "COMPLETED" | "CANCELLED" | "REFUNDED" | string;
  createdAt: string;
  updatedAt?: string;
  payments: {
    id: string;
    paymentMethod: CustomerPaymentMethod;
    amount: number | string;
    receivedAmount: number | string | null;
    changeAmount: number | string | null;
    referenceNumber: string | null;
    createdAt?: string;
  }[];
  customer?: { id: string; name: string; customerCode: string; email?: string | null; phone?: string | null } | null;
  cashier?: { id: string; firstName: string; lastName: string; email?: string | null } | null;
  branch?: { id: string; name: string; code?: string | null } | null;
  warehouse?: { id: string; name: string; code?: string | null } | null;
}

export function usePOSSales(filtersOrSessionId?: string | PosSalesFilters) {
  const queryStr = (() => {
    if (typeof filtersOrSessionId === "string") {
      return filtersOrSessionId ? `?sessionId=${encodeURIComponent(filtersOrSessionId)}` : "";
    }
    if (!filtersOrSessionId) return "";
    const params = new URLSearchParams();
    Object.entries(filtersOrSessionId).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "ALL") {
        params.set(k, String(v));
      }
    });
    const s = params.toString();
    return s ? `?${s}` : "";
  })();

  return useQuery<POSSaleRecord[]>({
    queryKey: ["pos-sales", filtersOrSessionId],
    queryFn: () => apiClient<POSSaleRecord[]>(`/pos/sales${queryStr}`),
  });
}

export function usePOSSale(id: string) {
  return useQuery<any>({
    queryKey: ["pos-sale", id],
    queryFn: () => apiClient<any>(`/pos/sales/${id}`),
    enabled: Boolean(id),
  });
}

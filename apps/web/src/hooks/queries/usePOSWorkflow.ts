import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { POSCartItemData, POSTransactionStatus } from "./usePOSCarts";

export interface POSWorkflowTransitionItem {
  id: string;
  organizationId: string;
  cartId: string;
  fromStatus: POSTransactionStatus;
  toStatus: POSTransactionStatus;
  actorId: string;
  notes: string | null;
  metadata: any;
  createdAt: string;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface POSQueueCartItem {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  sessionId: string | null;
  customerId: string | null;
  cartNumber: string | null;
  workflowStatus: POSTransactionStatus;
  salespersonId: string | null;
  billingStaffId: string | null;
  billingClaimedAt: string | null;
  cashierId: string | null;
  paymentClaimedAt: string | null;
  cancellationReason: string | null;
  cancelledById: string | null;
  cancelledAt: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    customerCode?: string;
    phone?: string;
    email?: string;
  } | null;
  salesperson?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  billingStaff?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  cashier?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  branch?: { id: string; name: string; code: string | null } | null;
  warehouse?: { id: string; name: string; code: string } | null;
  items: POSCartItemData[];
  transitions?: POSWorkflowTransitionItem[];
}

export interface POSQueueResponse {
  items: POSQueueCartItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface POSQueueFilter {
  branchId?: string | undefined;
  warehouseId?: string | undefined;
  search?: string | undefined;
  status?: POSTransactionStatus | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

/**
 * Fetch pending work from GET /pos/billing/queue with 5s polling
 */
export function useBillingQueue(filter?: POSQueueFilter, enabled = true) {
  const queryParams = new URLSearchParams();
  if (filter?.branchId) queryParams.set("branchId", filter.branchId);
  if (filter?.warehouseId) queryParams.set("warehouseId", filter.warehouseId);
  if (filter?.search) queryParams.set("search", filter.search);
  if (filter?.status) queryParams.set("status", filter.status);
  if (filter?.page) queryParams.set("page", filter.page.toString());
  if (filter?.limit) queryParams.set("limit", filter.limit.toString());

  const qStr = queryParams.toString();

  return useQuery<POSQueueResponse>({
    queryKey: ["pos-billing-queue", filter],
    queryFn: () =>
      apiClient<POSQueueResponse>(`/pos/billing/queue${qStr ? `?${qStr}` : ""}`),
    enabled,
    refetchInterval: enabled ? 5000 : false, // Poll every 5s while screen is active
  });
}

/**
 * Fetch pending bills from GET /pos/payment/queue with 5s polling
 */
export function usePaymentQueue(filter?: POSQueueFilter, enabled = true) {
  const queryParams = new URLSearchParams();
  if (filter?.branchId) queryParams.set("branchId", filter.branchId);
  if (filter?.warehouseId) queryParams.set("warehouseId", filter.warehouseId);
  if (filter?.search) queryParams.set("search", filter.search);
  if (filter?.status) queryParams.set("status", filter.status);
  if (filter?.page) queryParams.set("page", filter.page.toString());
  if (filter?.limit) queryParams.set("limit", filter.limit.toString());

  const qStr = queryParams.toString();

  return useQuery<POSQueueResponse>({
    queryKey: ["pos-payment-queue", filter],
    queryFn: () =>
      apiClient<POSQueueResponse>(`/pos/payment/queue${qStr ? `?${qStr}` : ""}`),
    enabled,
    refetchInterval: enabled ? 5000 : false, // Poll every 5s while screen is active
  });
}

/**
 * Fetch full audit history and transitions for a cart
 */
export function usePOSTransactionHistory(cartId?: string) {
  return useQuery<POSQueueCartItem>({
    queryKey: ["pos-cart-workflow", cartId],
    queryFn: () => apiClient<POSQueueCartItem>(`/pos/carts/${cartId}/workflow`),
    enabled: Boolean(cartId),
  });
}

/**
 * Send draft cart to billing queue
 */
export function useSendToBilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cartId,
      customerId,
      notes,
    }: {
      cartId: string;
      customerId?: string | null | undefined;
      notes?: string | undefined;
    }) =>
      apiClient<POSQueueCartItem>(`/pos/carts/${cartId}/send-to-billing`, {
        method: "POST",
        body: JSON.stringify({ customerId, notes }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-billing-queue"] });
    },
  });
}

/**
 * Claim cart for billing verification
 */
export function useClaimBilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) =>
      apiClient<POSQueueCartItem>(`/pos/carts/${cartId}/claim-billing`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-billing-queue"] });
    },
  });
}

/**
 * Forward verified bill to payment queue
 */
export function useSendToPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, notes }: { cartId: string; notes?: string | undefined }) =>
      apiClient<POSQueueCartItem>(`/pos/carts/${cartId}/send-to-payment`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-billing-queue"] });
      queryClient.invalidateQueries({ queryKey: ["pos-payment-queue"] });
    },
  });
}

/**
 * Claim bill for payment processing
 */
export function useClaimPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) =>
      apiClient<POSQueueCartItem>(`/pos/carts/${cartId}/claim-payment`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-payment-queue"] });
    },
  });
}

/**
 * Return claimed transaction back to queue
 */
export function useReturnToQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, notes }: { cartId: string; notes?: string }) =>
      apiClient<POSQueueCartItem>(`/pos/carts/${cartId}/return-to-queue`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-billing-queue"] });
      queryClient.invalidateQueries({ queryKey: ["pos-payment-queue"] });
    },
  });
}

/**
 * Cancel a POS transaction with mandatory reason
 */
export function useCancelPOSTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, reason }: { cartId: string; reason: string }) =>
      apiClient<POSQueueCartItem>(`/pos/carts/${cartId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-billing-queue"] });
      queryClient.invalidateQueries({ queryKey: ["pos-payment-queue"] });
    },
  });
}

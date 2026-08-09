import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface PurchaseRequestItemData {
  id?: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  estimatedCost?: number;
  product?: { id: string; name: string; sku: string };
  variant?: { id: string; name: string; sku: string } | null;
}

export interface PurchaseRequestItem {
  id: string;
  organizationId: string;
  requestNumber: string;
  requesterId: string;
  branchId: string | null;
  warehouseId: string;
  requiredDate: string | null;
  reason: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  requester?: { id: string; firstName: string; lastName: string; email: string };
  warehouse?: { id: string; name: string; code: string };
  items: PurchaseRequestItemData[];
}

export function usePurchaseRequests(status?: string) {
  return useQuery<PurchaseRequestItem[]>({
    queryKey: ["purchase-requests", status],
    queryFn: () =>
      apiClient<PurchaseRequestItem[]>(`/purchase-requests${status ? `?status=${status}` : ""}`),
  });
}

export function usePurchaseRequest(id: string) {
  return useQuery<PurchaseRequestItem>({
    queryKey: ["purchase-request", id],
    queryFn: () => apiClient<PurchaseRequestItem>(`/purchase-requests/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      branchId?: string | undefined;
      warehouseId?: string | undefined;
      requiredDate?: string | undefined;
      reason?: string | undefined;
      items: {
        productId: string;
        variantId?: string | undefined;
        quantity: number;
        estimatedCost?: number | undefined;
      }[];
    }) =>
      apiClient<PurchaseRequestItem>("/purchase-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
    },
  });
}

export function useUpdatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient<PurchaseRequestItem>(`/purchase-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request", id] });
    },
  });
}

export function useSubmitPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<PurchaseRequestItem>(`/purchase-requests/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request", id] });
    },
  });
}

export function useApprovePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<PurchaseRequestItem>(`/purchase-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request", id] });
    },
  });
}

export function useRejectPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<PurchaseRequestItem>(`/purchase-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request", id] });
    },
  });
}

export function useCancelPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient<PurchaseRequestItem>(`/purchase-requests/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-request", id] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface POSCartItemData {
  id: string;
  organizationId: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  product?: { id: string; name: string; sku: string; images?: string[] };
  variant?: { id: string; name: string; sku: string } | null;
}

export interface POSCartData {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  sessionId: string;
  customerId: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  status: "ACTIVE" | "HELD" | "COMPLETED" | "ABANDONED";
  createdAt: string;
  updatedAt: string;
  items: POSCartItemData[];
  customer?: {
    id: string;
    name: string;
    customerCode: string;
    phone?: string;
    email?: string;
  } | null;
}

export interface CreatePOSCartDto {
  branchId: string;
  warehouseId: string;
  sessionId: string;
  customerId?: string;
  notes?: string;
}

export interface AddPOSCartItemDto {
  productId: string;
  variantId?: string | undefined;
  quantity: number;
  unitPrice?: number | undefined;
  discountAmount?: number | undefined;
  taxRate?: number | undefined;
}

export interface UpdatePOSCartItemDto {
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export function usePOSCart(id?: string) {
  return useQuery<POSCartData>({
    queryKey: ["pos-cart", id],
    queryFn: () => apiClient<POSCartData>(`/pos/carts/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePOSCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePOSCartDto) =>
      apiClient<POSCartData>("/pos/carts", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-sessions"] });
    },
  });
}

export function useAddPOSCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, dto }: { cartId: string; dto: AddPOSCartItemDto }) =>
      apiClient<POSCartData>(`/pos/carts/${cartId}/items`, {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
    },
  });
}

export function useUpdatePOSCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cartId,
      itemId,
      dto,
    }: {
      cartId: string;
      itemId: string;
      dto: UpdatePOSCartItemDto;
    }) =>
      apiClient<POSCartData>(`/pos/carts/${cartId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
    },
  });
}

export function useRemovePOSCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, itemId }: { cartId: string; itemId: string }) =>
      apiClient<POSCartData>(`/pos/carts/${cartId}/items/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
    },
  });
}

export function useHoldPOSCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, notes }: { cartId: string; notes?: string }) =>
      apiClient<POSCartData>(`/pos/carts/${cartId}/hold`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-session"] });
    },
  });
}

export function useResumePOSCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) =>
      apiClient<POSCartData>(`/pos/carts/${cartId}/resume`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", data.id] });
      queryClient.invalidateQueries({ queryKey: ["pos-session"] });
    },
  });
}

export function useClearPOSCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) =>
      apiClient<POSCartData>(`/pos/carts/${cartId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, cartId) => {
      queryClient.invalidateQueries({ queryKey: ["pos-cart", cartId] });
    },
  });
}

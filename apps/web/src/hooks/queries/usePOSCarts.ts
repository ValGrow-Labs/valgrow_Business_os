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
  product?: {
    id: string;
    name: string;
    sku: string;
    barcode?: string | null | undefined;
    images?: string[] | undefined;
  } | undefined;
  variant?: {
    id: string;
    name: string;
    sku: string;
    barcode?: string | null | undefined;
  } | null | undefined;
}

export type POSTransactionStatus =
  | "DRAFT"
  | "SENT_TO_BILLING"
  | "BILLING_IN_PROGRESS"
  | "READY_FOR_PAYMENT"
  | "PAYMENT_IN_PROGRESS"
  | "PAID"
  | "CANCELLED";

export interface POSCartData {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  sessionId: string | null;
  customerId: string | null;
  cartNumber?: string | null | undefined;
  workflowStatus?: POSTransactionStatus | undefined;
  salespersonId?: string | null | undefined;
  billingStaffId?: string | null | undefined;
  billingClaimedAt?: string | null | undefined;
  cashierId?: string | null | undefined;
  paymentClaimedAt?: string | null | undefined;
  cancellationReason?: string | null | undefined;
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
    phone?: string | undefined;
    email?: string | undefined;
  } | null | undefined;
  salesperson?: { id: string; firstName: string; lastName: string; email: string } | null | undefined;
  billingStaff?: { id: string; firstName: string; lastName: string; email: string } | null | undefined;
  cashier?: { id: string; firstName: string; lastName: string; email: string } | null | undefined;
}

export interface CreatePOSCartDto {
  branchId: string;
  warehouseId: string;
  sessionId?: string | null | undefined;
  customerId?: string | null | undefined;
  notes?: string | undefined;
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
  unitPrice?: number | undefined;
  discountAmount?: number | undefined;
}

export interface UpdatePOSCartDto {
  customerId?: string | null | undefined;
  notes?: string | null | undefined;
}

export function usePOSCart(id?: string) {
  return useQuery<POSCartData>({
    queryKey: ["pos-cart", id],
    queryFn: () => apiClient<POSCartData>(`/pos/carts/${id}`),
    enabled: Boolean(id),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const status = query.state.data?.workflowStatus;
      // Only poll when cart is in shared queue states (billing/payment claimed), not during active local drafting
      if (
        status &&
        status !== "DRAFT" &&
        status !== "PAID" &&
        status !== "CANCELLED"
      ) {
        return 3000;
      }
      return false;
    },
  });
}

export function useUpdatePOSCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, dto }: { cartId: string; dto: UpdatePOSCartDto }) =>
      apiClient<POSCartData>(`/pos/carts/${cartId}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["pos-cart", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["pos-billing-queue"] });
      queryClient.invalidateQueries({ queryKey: ["pos-payment-queue"] });
    },
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
      queryClient.setQueryData(["pos-cart", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["pos-sessions"] });
    },
  });
}

export interface AddPOSCartItemMutationParams {
  cartId: string;
  dto: AddPOSCartItemDto;
  productInfo?: {
    name: string;
    sku: string;
    images?: string[] | undefined;
    barcode?: string | null | undefined;
  } | undefined;
  realCartIdPromise?: Promise<string> | undefined;
}

export function useAddPOSCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cartId, dto, realCartIdPromise }: AddPOSCartItemMutationParams) => {
      let targetCartId = cartId;
      if (cartId.startsWith("optimistic-") || realCartIdPromise) {
        targetCartId = realCartIdPromise ? await realCartIdPromise : cartId;
      }
      return apiClient<POSCartData>(`/pos/carts/${targetCartId}/items`, {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },
    onMutate: async ({ cartId, dto, productInfo }) => {
      const tMut = performance.now();
      console.log(`[POS-PERF] 4. onMutate executing for cartId: "${cartId}" at +${tMut.toFixed(2)}ms`);

      await queryClient.cancelQueries({ queryKey: ["pos-cart", cartId] });
      let previousCart = queryClient.getQueryData<POSCartData>(["pos-cart", cartId]);

      // If previousCart is not yet in cache, create the base draft cart immediately so UI NEVER waits!
      if (!previousCart) {
        previousCart = {
          id: cartId,
          organizationId: "",
          branchId: "",
          warehouseId: "",
          sessionId: null,
          customerId: null,
          cartNumber: null,
          workflowStatus: "DRAFT",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtotalAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: 0,
          notes: null,
          items: [],
        };
      }

      const qtyToAdd = Number(dto.quantity || 1);
      const unitPrice = Number(dto.unitPrice ?? 0);
      const discountAmount = Number(dto.discountAmount ?? 0);
      const taxRate = Number(dto.taxRate ?? 0);

      const existingItemIndex = previousCart.items.findIndex(
        (item) =>
          item.productId === dto.productId &&
          (item.variantId || null) === (dto.variantId || null),
      );

      let updatedItems: POSCartItemData[];
      const existingItem = existingItemIndex >= 0 ? previousCart.items[existingItemIndex] : undefined;

      if (existingItem) {
        const newQty = Number(existingItem.quantity) + qtyToAdd;
        const effUnitPrice = dto.unitPrice !== undefined ? unitPrice : Number(existingItem.unitPrice);
        const lineSubtotal = Math.max(0, newQty * effUnitPrice - Number(existingItem.discountAmount || 0));
        const effTaxRate = dto.taxRate !== undefined ? taxRate : Number(existingItem.taxRate || 0);
        const taxAmount = (lineSubtotal * effTaxRate) / 100;
        const totalAmount = lineSubtotal + taxAmount;

        const updatedProduct = productInfo
          ? {
              id: dto.productId,
              name: productInfo.name,
              sku: productInfo.sku,
              ...(productInfo.barcode !== undefined ? { barcode: productInfo.barcode } : {}),
              ...(productInfo.images !== undefined ? { images: productInfo.images } : {}),
            }
          : existingItem.product;

        const updatedItem: POSCartItemData = {
          id: existingItem.id,
          organizationId: existingItem.organizationId,
          cartId: existingItem.cartId,
          productId: existingItem.productId,
          variantId: existingItem.variantId,
          quantity: newQty,
          unitPrice: effUnitPrice,
          discountAmount: Number(existingItem.discountAmount || 0),
          taxRate: effTaxRate,
          taxAmount,
          totalAmount,
          ...(updatedProduct ? { product: updatedProduct } : {}),
          ...(existingItem.variant !== undefined ? { variant: existingItem.variant } : {}),
        };

        updatedItems = [...previousCart.items];
        updatedItems[existingItemIndex] = updatedItem;
      } else {
        const lineSubtotal = Math.max(0, qtyToAdd * unitPrice - discountAmount);
        const taxAmount = (lineSubtotal * taxRate) / 100;
        const totalAmount = lineSubtotal + taxAmount;

        const productData = productInfo
          ? {
              id: dto.productId,
              name: productInfo.name,
              sku: productInfo.sku,
              ...(productInfo.barcode !== undefined ? { barcode: productInfo.barcode } : {}),
              ...(productInfo.images !== undefined ? { images: productInfo.images } : {}),
            }
          : { id: dto.productId, name: "Product", sku: "" };

        const optimisticItem: POSCartItemData = {
          id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          organizationId: previousCart.organizationId,
          cartId: previousCart.id,
          productId: dto.productId,
          variantId: dto.variantId || null,
          quantity: qtyToAdd,
          unitPrice,
          discountAmount,
          taxRate,
          taxAmount,
          totalAmount,
          product: productData,
          variant: dto.variantId ? { id: dto.variantId, name: "Variant", sku: "" } : null,
        };

        updatedItems = [...previousCart.items, optimisticItem];
      }

      const subtotalAmount = updatedItems.reduce(
        (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
        0,
      );
      const totalDiscount = updatedItems.reduce(
        (sum, i) => sum + Number(i.discountAmount || 0),
        0,
      );
      const totalTax = updatedItems.reduce(
        (sum, i) => sum + Number(i.taxAmount || 0),
        0,
      );
      const netSubtotal = Math.max(0, subtotalAmount - totalDiscount);
      const totalAmount = netSubtotal + totalTax;

      const optimisticCart: POSCartData = {
        ...previousCart,
        items: updatedItems,
        subtotalAmount,
        discountAmount: totalDiscount,
        taxAmount: totalTax,
        totalAmount,
      };

      queryClient.setQueryData(["pos-cart", cartId], optimisticCart);
      console.log(`[POS-PERF] 5. Current Order cache updated: key=["pos-cart", "${cartId}"], items=${optimisticCart.items.length} at +${performance.now().toFixed(2)}ms`);

      return { previousCart, tempCartId: cartId.startsWith("optimistic-") ? cartId : undefined };
    },
    onError: (_err, { cartId }, context) => {
      console.error(`[POS-PERF] Mutation failed for cartId: ${cartId}`, _err);
      if (context?.previousCart) {
        queryClient.setQueryData(["pos-cart", cartId], context.previousCart);
      }
    },
    onSuccess: (data, _variables, context) => {
      console.log(`[POS-PERF] 7. API response completed: serverCartId="${data.id}", items=${data.items.length} at +${performance.now().toFixed(2)}ms`);
      queryClient.setQueryData<POSCartData>(["pos-cart", data.id], (currentCache) => {
        if (!currentCache) return data;
        const serverItemKeys = new Set(data.items.map((i) => `${i.productId}:${i.variantId || ""}`));
        const pendingOptimisticItems = currentCache.items.filter(
          (item) => item.id.startsWith("temp-") && !serverItemKeys.has(`${item.productId}:${item.variantId || ""}`)
        );
        if (pendingOptimisticItems.length === 0) {
          return data;
        }
        const subtotalExtra = pendingOptimisticItems.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
        const taxExtra = pendingOptimisticItems.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
        return {
          ...data,
          items: [...data.items, ...pendingOptimisticItems],
          subtotalAmount: Number(data.subtotalAmount) + subtotalExtra,
          totalAmount: Number(data.totalAmount) + subtotalExtra + taxExtra,
        };
      });
      if (context?.tempCartId && context.tempCartId !== data.id) {
        queryClient.removeQueries({ queryKey: ["pos-cart", context.tempCartId] });
      }
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
    onMutate: async ({ cartId, itemId, dto }) => {
      await queryClient.cancelQueries({ queryKey: ["pos-cart", cartId] });
      const previousCart = queryClient.getQueryData<POSCartData>(["pos-cart", cartId]);

      if (previousCart) {
        const itemIndex = previousCart.items.findIndex((i) => i.id === itemId);
        const item = itemIndex >= 0 ? previousCart.items[itemIndex] : undefined;

        if (item) {
          const qty = Number(dto.quantity);
          const unitPrice = dto.unitPrice !== undefined ? Number(dto.unitPrice) : Number(item.unitPrice);
          const discount = dto.discountAmount !== undefined ? Number(dto.discountAmount) : Number(item.discountAmount || 0);
          const lineSubtotal = Math.max(0, qty * unitPrice - discount);
          const taxAmount = (lineSubtotal * Number(item.taxRate || 0)) / 100;
          const totalAmount = lineSubtotal + taxAmount;

          const updatedItem: POSCartItemData = {
            id: item.id,
            organizationId: item.organizationId,
            cartId: item.cartId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: qty,
            unitPrice,
            discountAmount: discount,
            taxRate: Number(item.taxRate || 0),
            taxAmount,
            totalAmount,
            ...(item.product ? { product: item.product } : {}),
            ...(item.variant !== undefined ? { variant: item.variant } : {}),
          };

          const updatedItems = [...previousCart.items];
          updatedItems[itemIndex] = updatedItem;

          const subtotalAmount = updatedItems.reduce(
            (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
            0,
          );
          const totalDiscount = updatedItems.reduce(
            (sum, i) => sum + Number(i.discountAmount || 0),
            0,
          );
          const totalTax = updatedItems.reduce(
            (sum, i) => sum + Number(i.taxAmount || 0),
            0,
          );
          const netSubtotal = Math.max(0, subtotalAmount - totalDiscount);

          queryClient.setQueryData(["pos-cart", cartId], {
            ...previousCart,
            items: updatedItems,
            subtotalAmount,
            discountAmount: totalDiscount,
            taxAmount: totalTax,
            totalAmount: netSubtotal + totalTax,
          });
        }
      }

      return { previousCart };
    },
    onError: (_err, { cartId }, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["pos-cart", cartId], context.previousCart);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["pos-cart", data.id], data);
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
    onMutate: async ({ cartId, itemId }) => {
      await queryClient.cancelQueries({ queryKey: ["pos-cart", cartId] });
      const previousCart = queryClient.getQueryData<POSCartData>(["pos-cart", cartId]);

      if (previousCart) {
        const updatedItems = previousCart.items.filter((i) => i.id !== itemId);
        const subtotalAmount = updatedItems.reduce(
          (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
          0,
        );
        const totalDiscount = updatedItems.reduce(
          (sum, i) => sum + Number(i.discountAmount || 0),
          0,
        );
        const totalTax = updatedItems.reduce(
          (sum, i) => sum + Number(i.taxAmount || 0),
          0,
        );
        const netSubtotal = Math.max(0, subtotalAmount - totalDiscount);

        queryClient.setQueryData(["pos-cart", cartId], {
          ...previousCart,
          items: updatedItems,
          subtotalAmount,
          discountAmount: totalDiscount,
          taxAmount: totalTax,
          totalAmount: netSubtotal + totalTax,
        });
      }

      return { previousCart };
    },
    onError: (_err, { cartId }, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["pos-cart", cartId], context.previousCart);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["pos-cart", data.id], data);
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
      queryClient.setQueryData(["pos-cart", data.id], data);
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
      queryClient.setQueryData(["pos-cart", data.id], data);
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

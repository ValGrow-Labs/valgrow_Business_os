import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const round2 = (val: number): number =>
  Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;

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
        const lineSubtotal = round2(Math.max(0, newQty * effUnitPrice - Number(existingItem.discountAmount || 0)));
        const effTaxRate = dto.taxRate !== undefined ? taxRate : Number(existingItem.taxRate || 0);
        const taxAmount = round2((lineSubtotal * effTaxRate) / 100);
        const totalAmount = round2(lineSubtotal + taxAmount);

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
        const lineSubtotal = round2(Math.max(0, qtyToAdd * unitPrice - discountAmount));
        const taxAmount = round2((lineSubtotal * taxRate) / 100);
        const totalAmount = round2(lineSubtotal + taxAmount);

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

      const subtotalAmount = round2(
        updatedItems.reduce(
          (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
          0,
        ),
      );
      const totalDiscount = round2(
        updatedItems.reduce(
          (sum, i) => sum + Number(i.discountAmount || 0),
          0,
        ),
      );
      const totalTax = round2(
        updatedItems.reduce(
          (sum, i) => sum + Number(i.taxAmount || 0),
          0,
        ),
      );
      const netSubtotal = round2(Math.max(0, subtotalAmount - totalDiscount));
      const totalAmount = round2(netSubtotal + totalTax);

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

export interface UpdatePOSCartItemParams {
  cartId: string;
  itemId: string;
  dto: UpdatePOSCartItemDto;
  productId?: string | undefined;
  variantId?: string | null | undefined;
  realCartIdPromise?: Promise<string> | undefined;
}

export function useUpdatePOSCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cartId,
      itemId,
      dto,
      productId,
      variantId,
      realCartIdPromise,
    }: UpdatePOSCartItemParams) => {
      let targetCartId = cartId;
      if (cartId.startsWith("optimistic-") || realCartIdPromise) {
        targetCartId = realCartIdPromise ? await realCartIdPromise : cartId;
      }

      let targetItemId = itemId;
      // If itemId is temporary (optimistic item still in flight), find real item ID from latest cache
      if (targetItemId.startsWith("temp-")) {
        for (let i = 0; i < 15; i++) {
          const currentCart =
            queryClient.getQueryData<POSCartData>(["pos-cart", targetCartId]) ||
            queryClient.getQueryData<POSCartData>(["pos-cart", cartId]);
          if (currentCart) {
            const realItem = currentCart.items.find(
              (it) =>
                !it.id.startsWith("temp-") &&
                (it.id === targetItemId ||
                  (productId && it.productId === productId && (it.variantId || null) === (variantId || null))),
            );
            if (realItem) {
              targetItemId = realItem.id;
              break;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return apiClient<POSCartData>(`/pos/carts/${targetCartId}/items/${targetItemId}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
      });
    },
    onMutate: async ({ cartId, itemId, dto, productId, variantId }) => {
      await queryClient.cancelQueries({ queryKey: ["pos-cart", cartId] });
      const previousCart = queryClient.getQueryData<POSCartData>(["pos-cart", cartId]);

      if (previousCart) {
        const itemIndex = previousCart.items.findIndex(
          (i) =>
            i.id === itemId ||
            (productId && i.productId === productId && (i.variantId || null) === (variantId || null)),
        );
        const item = itemIndex >= 0 ? previousCart.items[itemIndex] : undefined;

        if (item) {
          const qty = Number(dto.quantity);
          const unitPrice = dto.unitPrice !== undefined ? Number(dto.unitPrice) : Number(item.unitPrice);
          const discount =
            dto.discountAmount !== undefined ? Number(dto.discountAmount) : Number(item.discountAmount || 0);
          const lineSubtotal = round2(Math.max(0, qty * unitPrice - discount));
          const taxAmount = round2((lineSubtotal * Number(item.taxRate || 0)) / 100);
          const totalAmount = round2(lineSubtotal + taxAmount);

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

          const subtotalAmount = round2(
            updatedItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0),
          );
          const totalDiscount = round2(
            updatedItems.reduce((sum, i) => sum + Number(i.discountAmount || 0), 0),
          );
          const totalTax = round2(
            updatedItems.reduce((sum, i) => sum + Number(i.taxAmount || 0), 0),
          );
          const netSubtotal = round2(Math.max(0, subtotalAmount - totalDiscount));

          queryClient.setQueryData(["pos-cart", cartId], {
            ...previousCart,
            items: updatedItems,
            subtotalAmount,
            discountAmount: totalDiscount,
            taxAmount: totalTax,
            totalAmount: round2(netSubtotal + totalTax),
          });
        }
      }

      return { previousCart };
    },
    onError: (err: any, { cartId }, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["pos-cart", cartId], context.previousCart);
      }
      toast.error("Failed to update item quantity", {
        description: err?.message || "Check stock levels and try again.",
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<POSCartData>(["pos-cart", data.id], (currentCache) => {
        if (!currentCache) return data;
        // Merge with current cache: if current cache has a newer quantity than the response, keep the newer cached quantity!
        const cachedItem = currentCache.items.find(
          (i) =>
            i.id === variables.itemId ||
            (variables.productId && i.productId === variables.productId),
        );
        if (cachedItem && Number(cachedItem.quantity) !== Number(variables.dto.quantity)) {
          const updatedItems = data.items.map((serverItem) => {
            if (
              serverItem.id === variables.itemId ||
              (variables.productId && serverItem.productId === variables.productId)
            ) {
              const qty = Number(cachedItem.quantity);
              const unitPrice = Number(serverItem.unitPrice);
              const discount = Number(serverItem.discountAmount || 0);
              const lineSubtotal = round2(Math.max(0, qty * unitPrice - discount));
              const taxAmount = round2((lineSubtotal * Number(serverItem.taxRate || 0)) / 100);
              return {
                ...serverItem,
                quantity: qty,
                taxAmount,
                totalAmount: round2(lineSubtotal + taxAmount),
              };
            }
            return serverItem;
          });
          const subtotalAmount = round2(
            updatedItems.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0),
          );
          const totalDiscount = round2(
            updatedItems.reduce((s, i) => s + Number(i.discountAmount || 0), 0),
          );
          const totalTax = round2(
            updatedItems.reduce((s, i) => s + Number(i.taxAmount || 0), 0),
          );
          const netSubtotal = round2(Math.max(0, subtotalAmount - totalDiscount));
          return {
            ...data,
            items: updatedItems,
            subtotalAmount,
            discountAmount: totalDiscount,
            taxAmount: totalTax,
            totalAmount: round2(netSubtotal + totalTax),
          };
        }
        return data;
      });
    },
  });
}

export interface RemovePOSCartItemParams {
  cartId: string;
  itemId: string;
  productId?: string | undefined;
}

export function useRemovePOSCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cartId, itemId, productId }: RemovePOSCartItemParams) => {
      let targetCartId = cartId;
      let targetItemId = itemId;

      if (targetCartId.startsWith("optimistic-") || targetItemId.startsWith("temp-")) {
        const allQueries = queryClient.getQueryCache().findAll({ queryKey: ["pos-cart"] });
        for (const q of allQueries) {
          const cached = q.state.data as POSCartData | undefined;
          if (cached && !cached.id.startsWith("optimistic-")) {
            targetCartId = cached.id;
            const realItem = cached.items.find(
              (it) =>
                !it.id.startsWith("temp-") &&
                (it.id === targetItemId || (productId && it.productId === productId)),
            );
            if (realItem) {
              targetItemId = realItem.id;
              break;
            }
          }
        }
      }

      if (targetItemId.startsWith("temp-")) {
        // Was only an optimistic item not yet on server
        return { id: targetCartId, items: [] } as any;
      }

      return apiClient<POSCartData>(`/pos/carts/${targetCartId}/items/${targetItemId}`, {
        method: "DELETE",
      });
    },
    onMutate: async ({ cartId, itemId, productId }) => {
      await queryClient.cancelQueries({ queryKey: ["pos-cart", cartId] });
      const previousCart = queryClient.getQueryData<POSCartData>(["pos-cart", cartId]);

      if (previousCart) {
        const updatedItems = previousCart.items.filter(
          (i) => i.id !== itemId && (!productId || i.productId !== productId),
        );
        const subtotalAmount = round2(
          updatedItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0),
        );
        const totalDiscount = round2(
          updatedItems.reduce((sum, i) => sum + Number(i.discountAmount || 0), 0),
        );
        const totalTax = round2(
          updatedItems.reduce((sum, i) => sum + Number(i.taxAmount || 0), 0),
        );
        const netSubtotal = round2(Math.max(0, subtotalAmount - totalDiscount));

        queryClient.setQueryData(["pos-cart", cartId], {
          ...previousCart,
          items: updatedItems,
          subtotalAmount,
          discountAmount: totalDiscount,
          taxAmount: totalTax,
          totalAmount: round2(netSubtotal + totalTax),
        });
      }

      return { previousCart };
    },
    onError: (err: any, { cartId }, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["pos-cart", cartId], context.previousCart);
      }
      toast.error("Failed to remove item", {
        description: err?.message || "Please try again.",
      });
    },
    onSuccess: (data) => {
      if (data && data.id) {
        queryClient.setQueryData(["pos-cart", data.id], data);
      }
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

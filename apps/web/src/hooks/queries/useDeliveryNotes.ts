import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DeliveryNoteItemData {
  id?: string;
  salesOrderItemId: string;
  productId: string;
  variantId?: string | null;
  locationId: string;
  quantity: number;
  product?: { id: string; name: string; sku: string };
  variant?: { id: string; name: string; sku: string } | null;
  location?: { id: string; name: string; code: string };
}

export interface DeliveryNoteItem {
  id: string;
  organizationId: string;
  deliveryNumber: string;
  salesOrderId: string;
  customerId: string;
  warehouseId: string;
  deliveredById: string | null;
  deliveryDate: string;
  referenceNumber: string | null;
  notes: string | null;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  salesOrder?: {
    id: string;
    orderNumber: string;
    items?: {
      id: string;
      productId: string;
      orderedQty: number;
      deliveredQty: number;
      product?: { id: string; name: string; sku: string };
      variant?: { id: string; name: string; sku: string } | null;
    }[];
  };
  customer?: { id: string; name: string; customerCode: string };
  warehouse?: { id: string; name: string; code: string };
  deliveredBy?: { id: string; firstName: string; lastName: string } | null;
  items: DeliveryNoteItemData[];
}

export function useDeliveryNotes(status?: string) {
  return useQuery<DeliveryNoteItem[]>({
    queryKey: ["delivery-notes", status],
    queryFn: () =>
      apiClient<DeliveryNoteItem[]>(`/delivery-notes${status ? `?status=${status}` : ""}`),
  });
}

export function useDeliveryNote(id: string) {
  return useQuery<DeliveryNoteItem>({
    queryKey: ["delivery-note", id],
    queryFn: () => apiClient<DeliveryNoteItem>(`/delivery-notes/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      salesOrderId: string;
      customerId: string;
      warehouseId: string;
      deliveredById?: string | undefined;
      deliveryDate?: string | undefined;
      referenceNumber?: string | undefined;
      notes?: string | undefined;
      items: {
        salesOrderItemId: string;
        productId: string;
        variantId?: string | undefined;
        locationId: string;
        quantity: number;
      }[];
    }) =>
      apiClient<DeliveryNoteItem>("/delivery-notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
    },
  });
}

export function usePostDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<DeliveryNoteItem>(`/delivery-notes/${id}/post`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-note", id] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
  });
}

export function useCancelDeliveryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<DeliveryNoteItem>(`/delivery-notes/${id}/cancel`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-notes"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-note", id] });
    },
  });
}

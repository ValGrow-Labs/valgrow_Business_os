import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ReservationItem {
  id: string;
  organizationId: string;
  locationId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  quantity: number | string;
  referenceType: string;
  referenceId: string;
  status: "ACTIVE" | "FULFILLED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  location?: { id: string; name: string; code: string } | null;
}

export function useInventoryReservations(status?: string) {
  const queryStr = status ? `?status=${status}` : "";

  return useQuery<ReservationItem[]>({
    queryKey: ["inventoryReservations", status],
    queryFn: () => apiClient<ReservationItem[]>(`/inventory/reservations${queryStr}`),
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ReservationItem>) =>
      apiClient<ReservationItem>("/inventory/reservations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryReservations"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStock"] });
    },
  });
}

export function useFulfillReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ReservationItem>(`/inventory/reservations/${id}/fulfill`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryReservations"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStock"] });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<ReservationItem>(`/inventory/reservations/${id}/cancel`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryReservations"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStock"] });
    },
  });
}

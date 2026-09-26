import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TransferItemLine {
  id: string;
  transferId: string;
  productId: string;
  variantId: string | null;
  batchId: string | null;
  sourceLocationId: string;
  destLocationId: string;
  requestedQty: number | string;
  shippedQty: number | string;
  receivedQty: number | string;
}

export interface TransferItem {
  id: string;
  organizationId: string;
  transferNumber: string;
  sourceWarehouseId: string;
  destWarehouseId: string;
  status: "DRAFT" | "PENDING" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  createdById: string;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceWarehouse?: { id: string; name: string; code: string } | null;
  destWarehouse?: { id: string; name: string; code: string } | null;
  items?: TransferItemLine[];
}

export function useInventoryTransfers(status?: string) {
  const queryStr = status ? `?status=${status}` : "";

  return useQuery<TransferItem[]>({
    queryKey: ["inventoryTransfers", status],
    queryFn: () => apiClient<TransferItem[]>(`/inventory/transfers${queryStr}`),
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TransferItem>) =>
      apiClient<TransferItem>("/inventory/transfers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryTransfers"] });
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransferItem> }) =>
      apiClient<TransferItem>(`/inventory/transfers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryTransfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStock"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryMovements"] });
    },
  });
}

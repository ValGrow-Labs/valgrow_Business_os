import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface POSSessionItem {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  terminalId: string;
  openedById: string;
  closedById: string | null;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  cashDifference: number | null;
  notes: string | null;
  status: "OPEN" | "CLOSED" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string | null };
  warehouse?: { id: string; name: string; code: string };
  openedBy?: { id: string; firstName: string; lastName: string; email: string };
  closedBy?: { id: string; firstName: string; lastName: string; email: string } | null;
  carts?: { id: string; status: string }[];
  sales?: { id: string; receiptNumber: string; totalAmount: number; createdAt: string }[];
}

export interface OpenPOSSessionDto {
  branchId: string;
  warehouseId: string;
  terminalId: string;
  openingCash: number;
  notes?: string;
}

export interface ClosePOSSessionDto {
  closingCash: number;
  notes?: string;
}

export function usePOSSessions(status?: string, terminalId?: string) {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append("status", status);
  if (terminalId) queryParams.append("terminalId", terminalId);
  const qStr = queryParams.toString();

  return useQuery<POSSessionItem[]>({
    queryKey: ["pos-sessions", status, terminalId],
    queryFn: () => apiClient<POSSessionItem[]>(`/pos/sessions${qStr ? `?${qStr}` : ""}`),
  });
}

export function usePOSSession(id: string) {
  return useQuery<POSSessionItem>({
    queryKey: ["pos-session", id],
    queryFn: () => apiClient<POSSessionItem>(`/pos/sessions/${id}`),
    enabled: Boolean(id),
  });
}

export function useOpenPOSSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: OpenPOSSessionDto) =>
      apiClient<POSSessionItem>("/pos/sessions/open", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-sessions"] });
    },
  });
}

export function useClosePOSSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ClosePOSSessionDto }) =>
      apiClient<POSSessionItem>(`/pos/sessions/${id}/close`, {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pos-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["pos-session", variables.id] });
    },
  });
}

export function useSuspendPOSSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<POSSessionItem>(`/pos/sessions/${id}/suspend`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pos-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["pos-session", id] });
    },
  });
}

export function useResumePOSSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<POSSessionItem>(`/pos/sessions/${id}/resume`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pos-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["pos-session", id] });
    },
  });
}

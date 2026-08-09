import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SalesCreditNoteItem {
  id: string;
  organizationId: string;
  creditNoteNumber: string;
  customerId: string;
  salesInvoiceId: string | null;
  salesReturnId: string | null;
  creditDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  reason: string | null;
  status: "DRAFT" | "ISSUED" | "APPLIED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; customerCode: string };
  salesInvoice?: { id: string; invoiceNumber: string } | null;
  salesReturn?: { id: string; returnNumber: string } | null;
}

export function useSalesCreditNotes(status?: string) {
  return useQuery<SalesCreditNoteItem[]>({
    queryKey: ["sales-credit-notes", status],
    queryFn: () =>
      apiClient<SalesCreditNoteItem[]>(`/sales-credit-notes${status ? `?status=${status}` : ""}`),
  });
}

export function useSalesCreditNote(id: string) {
  return useQuery<SalesCreditNoteItem>({
    queryKey: ["sales-credit-note", id],
    queryFn: () => apiClient<SalesCreditNoteItem>(`/sales-credit-notes/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSalesCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerId: string;
      salesInvoiceId?: string | undefined;
      salesReturnId?: string | undefined;
      creditDate?: string | undefined;
      amount: number;
      taxAmount?: number | undefined;
      reason?: string | undefined;
    }) =>
      apiClient<SalesCreditNoteItem>("/sales-credit-notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-credit-notes"] });
    },
  });
}

export function useUpdateSalesCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SalesCreditNoteItem> }) =>
      apiClient<SalesCreditNoteItem>(`/sales-credit-notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sales-credit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["sales-credit-note", id] });
    },
  });
}

export function useIssueSalesCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<SalesCreditNoteItem>(`/sales-credit-notes/${id}/issue`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sales-credit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["sales-credit-note", id] });
    },
  });
}

export function useApplySalesCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<SalesCreditNoteItem>(`/sales-credit-notes/${id}/apply`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sales-credit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["sales-credit-note", id] });
    },
  });
}

export function useCancelSalesCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<SalesCreditNoteItem>(`/sales-credit-notes/${id}/cancel`, {
        method: "POST",
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sales-credit-notes"] });
      queryClient.invalidateQueries({ queryKey: ["sales-credit-note", id] });
    },
  });
}

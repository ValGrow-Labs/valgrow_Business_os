import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface JournalEntryLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string | null;
  account?: { id: string; accountCode: string; accountName: string };
  customer?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
}

export interface JournalEntryItem {
  id: string;
  journalNumber: string;
  entryDate: string;
  postingDate: string;
  entryType: "AUTOMATIC" | "MANUAL" | "ADJUSTING" | "CLOSING" | "REVERSAL";
  status: "DRAFT" | "POSTED" | "REVERSED" | "CANCELLED";
  sourceModule?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
  createdBy?: { id: string; firstName: string; lastName: string };
  postedBy?: { id: string; firstName: string; lastName: string } | null;
}

export function useJournalEntries(query?: {
  sourceModule?: string;
  referenceType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
}) {
  const params = new URLSearchParams();
  if (query?.sourceModule) params.append("sourceModule", query.sourceModule);
  if (query?.referenceType) params.append("referenceType", query.referenceType);
  if (query?.status) params.append("status", query.status);
  if (query?.startDate) params.append("startDate", query.startDate);
  if (query?.endDate) params.append("endDate", query.endDate);
  if (query?.accountId) params.append("accountId", query.accountId);

  const queryString = params.toString();

  return useQuery<JournalEntryItem[]>({
    queryKey: ["journal-entries", query],
    queryFn: () => apiClient<JournalEntryItem[]>(`/journal-entries${queryString ? `?${queryString}` : ""}`),
  });
}

export function useJournalEntry(id: string) {
  return useQuery<JournalEntryItem>({
    queryKey: ["journal-entry", id],
    queryFn: () => apiClient<JournalEntryItem>(`/journal-entries/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateManualJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      postingDate?: string;
      entryDate?: string;
      description?: string;
      sourceModule?: string;
      referenceType?: string;
      referenceId?: string;
      lines: {
        accountId: string;
        debit: number;
        credit: number;
        description?: string;
        branchId?: string;
        costCenterId?: string;
        customerId?: string;
        supplierId?: string;
      }[];
    }) =>
      apiClient<JournalEntryItem>("/journal-entries/manual", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

export function useReverseJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient<JournalEntryItem>(`/journal-entries/${id}/reverse`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry", id] });
    },
  });
}

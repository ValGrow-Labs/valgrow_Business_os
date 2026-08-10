import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useJournalEntries, useCreateManualJournalEntry, useReverseJournalEntry } from "@/hooks/queries/useJournalEntries";
import { useChartOfAccounts } from "@/hooks/queries/useChartOfAccounts";
import { Plus, Search, RotateCcw, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/journal-entries")({
  head: () => ({
    meta: [{ title: "Journal Entries · ValGrow Business OS" }],
  }),
  component: JournalEntriesPage,
});

function JournalEntriesPage() {
  const { data: entries, isLoading } = useJournalEntries();
  const { data: accounts } = useChartOfAccounts();
  const createManualMutation = useCreateManualJournalEntry();
  const reverseMutation = useReverseJournalEntry();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState("");

  const [lines, setLines] = useState([
    { accountId: "", debit: 0, credit: 0, description: "" },
    { accountId: "", debit: 0, credit: 0, description: "" },
  ]);
  const [description, setDescription] = useState("");

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const addLine = () => {
    setLines([...lines, { accountId: "", debit: 0, credit: 0, description: "" }]);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    createManualMutation.mutate(
      {
        description,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description,
        })),
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setDescription("");
          setLines([
            { accountId: "", debit: 0, credit: 0, description: "" },
            { accountId: "", debit: 0, credit: 0, description: "" },
          ]);
        },
      },
    );
  };

  const handleReverse = (id: string) => {
    if (!reversalReason) return;
    reverseMutation.mutate(
      { id, reason: reversalReason },
      {
        onSuccess: () => {
          setReversingId(null);
          setReversalReason("");
        },
      },
    );
  };

  const filteredEntries = entries?.filter(
    (j) =>
      j.journalNumber.toLowerCase().includes(search.toLowerCase()) ||
      (j.description && j.description.toLowerCase().includes(search.toLowerCase())) ||
      (j.sourceModule && j.sourceModule.toLowerCase().includes(search.toLowerCase())),
  ) || [];

  return (
    <AppShell>
      <PageHeader
        title="Journal Entries"
        description="Immutable General Ledger journal entries with double-entry balance validation."
        eyebrow="General Ledger Transactions"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" /> New Manual Journal
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6 border-primary/20 bg-accent/10">
          <CardHeader>
            <CardTitle>Create Manual Double-Entry Journal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Header Description</label>
                <Input
                  required
                  placeholder="e.g. Month-end Accruals"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Journal Lines</span>
                  <Button type="button" size="sm" variant="outline" onClick={addLine}>
                    + Add Line
                  </Button>
                </div>

                {lines.map((l, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-4 items-center">
                    <select
                      className="h-10 rounded-md border bg-background px-3 py-2 text-sm sm:col-span-2"
                      value={l.accountId}
                      onChange={(e) => {
                        const newLines = [...lines];
                        if (newLines[idx]) {
                          newLines[idx].accountId = e.target.value;
                          setLines(newLines);
                        }
                      }}
                      required
                    >
                      <option value="">Select Account...</option>
                      {accounts?.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountCode} - {acc.accountName}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Debit ₹"
                      value={l.debit || ""}
                      onChange={(e) => {
                        const newLines = [...lines];
                        const target = newLines[idx];
                        if (target) {
                          target.debit = parseFloat(e.target.value) || 0;
                          if (target.debit > 0) target.credit = 0;
                          setLines(newLines);
                        }
                      }}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Credit ₹"
                      value={l.credit || ""}
                      onChange={(e) => {
                        const newLines = [...lines];
                        const target = newLines[idx];
                        if (target) {
                          target.credit = parseFloat(e.target.value) || 0;
                          if (target.credit > 0) target.debit = 0;
                          setLines(newLines);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  Total Debit: <span className="font-bold">₹{totalDebit.toLocaleString("en-IN")}</span> | Total Credit:{" "}
                  <span className="font-bold">₹{totalCredit.toLocaleString("en-IN")}</span>
                  {!isBalanced && (
                    <span className="ml-2 text-xs text-destructive flex items-center inline-flex">
                      <AlertCircle className="mr-1 h-3 w-3" /> Unbalanced
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!isBalanced || createManualMutation.isPending}>
                    Post Journal Entry
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journal number, source..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">{filteredEntries.length} journal entries found</span>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Posting Date</th>
              <th className="px-4 py-3">Journal No</th>
              <th className="px-4 py-3">Source / Module</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading Journal Entries...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No journal entries recorded yet.
                </td>
              </tr>
            ) : (
              filteredEntries.map((je) => (
                <tr key={je.id} className="hover:bg-accent/5">
                  <td className="px-4 py-3">{new Date(je.postingDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">{je.journalNumber}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{je.sourceModule || "GL"}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{je.description || "-"}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{Number(je.totalDebit).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{Number(je.totalCredit).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={je.status === "POSTED" ? "default" : je.status === "REVERSED" ? "destructive" : "secondary"}>
                      {je.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {je.status === "POSTED" && (
                      reversingId === je.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="Reason"
                            className="h-7 text-xs w-28"
                            value={reversalReason}
                            onChange={(e) => setReversalReason(e.target.value)}
                          />
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleReverse(je.id)}>
                            Confirm
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setReversingId(je.id)}>
                          <RotateCcw className="mr-1 h-3 w-3" /> Reverse
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

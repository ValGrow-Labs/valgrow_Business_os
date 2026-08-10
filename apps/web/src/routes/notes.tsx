import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useCrmNotes, useCreateCrmNote, useDeleteCrmNote } from "@/hooks/queries/useCrmNotes";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useLeads } from "@/hooks/queries/useLeads";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

const title = "CRM Internal Notes";
const description = "Internal communication notes attached to customers, leads, or opportunities.";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("crm.create");
  const canDelete = permissions.includes("crm.delete");

  const { data: notesData, isLoading } = useCrmNotes();
  const { data: customers } = useCustomers();
  const { data: leads } = useLeads();

  const createNoteMutation = useCreateCrmNote();
  const deleteNoteMutation = useDeleteCrmNote();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [content, setContent] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [leadId, setLeadId] = useState("");

  const resetForm = () => {
    setContent("");
    setCustomerId("");
    setLeadId("");
    setErrorMsg(null);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createNoteMutation.mutateAsync({
        content,
        ...(customerId ? { customerId } : {}),
        ...(leadId ? { leadId } : {}),
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "content", header: "Note Content" },
    { key: "authorName", header: "Author" },
    { key: "createdAt", header: "Date Created" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const noteId = r["id"];
        if (!noteId) return null;
        return (
          <div className="flex items-center gap-1">
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={async () => {
                  if (confirm("Delete this internal note?")) {
                    await deleteNoteMutation.mutateAsync(noteId);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = (notesData || []).map((n) => ({
    id: n.id,
    content: n.content,
    authorName: n.author ? `${n.author.firstName} ${n.author.lastName || ""}` : "System",
    createdAt: new Date(n.createdAt).toLocaleString(),
  }));

  const stats = [
    { label: "Internal Notes", value: isLoading ? "…" : String(notesData?.length || 0) },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Relationship Management"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canCreate ? "New Note" : ""}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Note
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Internal CRM Note</DialogTitle>
            <DialogDescription>Attach internal notes for team reference.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNote} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Note Content *</Label>
              <Input required value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Attach to Customer</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">None</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Attach to Lead</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                >
                  <option value="">None</option>
                  {leads?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.leadNumber} - {l.firstName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Note</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

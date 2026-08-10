import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useLeadSources,
  useCreateLeadSource,
  useDeleteLeadSource,
} from "@/hooks/queries/useLeadSources";
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

const title = "Lead Sources";
const description =
  "Manage lead acquisition channels (e.g. Website, Referral, Cold Call, Social Media).";

export const Route = createFileRoute("/lead-sources")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: LeadSourcesPage,
});

function LeadSourcesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];
  const canManage = permissions.includes("crm.manage_sources");

  const { data: sourcesData, isLoading } = useLeadSources();
  const createSourceMutation = useCreateLeadSource();
  const deleteSourceMutation = useDeleteLeadSource();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [descriptionStr, setDescriptionStr] = useState("");

  const resetForm = () => {
    setName("");
    setDescriptionStr("");
    setErrorMsg(null);
  };

  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createSourceMutation.mutateAsync({
        name,
        ...(descriptionStr ? { description: descriptionStr } : {}),
      });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "name", header: "Source Name" },
    { key: "description", header: "Description" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const src = sourcesData?.find((s) => s.id === r["id"]);
        if (!src) return null;
        return (
          <div className="flex items-center gap-1">
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={async () => {
                  if (confirm(`Delete lead source ${src.name}?`)) {
                    await deleteSourceMutation.mutateAsync(src.id);
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

  const rows: ListRow[] = (sourcesData || []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description || "N/A",
    status: s.status,
  }));

  const stats = [
    { label: "Lead Channels", value: isLoading ? "…" : String(sourcesData?.length || 0) },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Lead Channel Master Data"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canManage ? "Add Lead Source" : ""}
        children={
          canManage ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Lead Source
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Lead Channel Source</DialogTitle>
            <DialogDescription>Define channel name for lead tracking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSource} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Source Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={descriptionStr} onChange={(e) => setDescriptionStr(e.target.value)} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Source</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

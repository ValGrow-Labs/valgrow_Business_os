import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useCrmTags,
  useCreateCrmTag,
  useDeleteCrmTag,
  useAssignCrmTag,
  type CrmTagItem,
} from "@/hooks/queries/useCrmTags";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useLeads } from "@/hooks/queries/useLeads";
import { useOpportunities } from "@/hooks/queries/useOpportunities";
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
import { Plus, Trash2, Tag as TagIcon } from "lucide-react";

const title = "CRM Tags";
const description =
  "Create reusable category pills (e.g. VIP, High Value, Enterprise, At Risk) and assign to records.";

export const Route = createFileRoute("/crm-tags")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: CrmTagsPage,
});

function CrmTagsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];
  const canManage = permissions.includes("crm.manage_tags");

  const { data: tagsData, isLoading } = useCrmTags();
  const { data: customers } = useCustomers();
  const { data: leads } = useLeads();
  const { data: opps } = useOpportunities();

  const createTagMutation = useCreateCrmTag();
  const deleteTagMutation = useDeleteCrmTag();
  const assignTagMutation = useAssignCrmTag();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [assigningTag, setAssigningTag] = useState<CrmTagItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");

  // Assign State
  const [targetType, setTargetType] = useState<"CUSTOMER" | "LEAD" | "OPPORTUNITY">("CUSTOMER");
  const [targetId, setTargetId] = useState("");

  const resetForm = () => {
    setName("");
    setColor("#3B82F6");
    setErrorMsg(null);
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createTagMutation.mutateAsync({ name, color });
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const handleAssignTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTag || !targetId) return;
    setErrorMsg(null);
    try {
      await assignTagMutation.mutateAsync({
        tagId: assigningTag.id,
        ...(targetType === "CUSTOMER" && targetId ? { customerId: targetId } : {}),
        ...(targetType === "LEAD" && targetId ? { leadId: targetId } : {}),
        ...(targetType === "OPPORTUNITY" && targetId ? { opportunityId: targetId } : {}),
      });
      setAssigningTag(null);
      setTargetId("");
    } catch (err: any) {
      setErrorMsg(err.message || "Assign failed");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "name", header: "Tag Name" },
    { key: "color", header: "Color Code" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const tag = tagsData?.find((t) => t.id === r["id"]);
        if (!tag) return null;
        return (
          <div className="flex items-center gap-1">
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setAssigningTag(tag);
                  setTargetType("CUSTOMER");
                  setTargetId("");
                  setErrorMsg(null);
                }}
              >
                <TagIcon className="mr-1 h-3 w-3" /> Assign Tag
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={async () => {
                  if (confirm(`Delete tag ${tag.name}?`)) {
                    await deleteTagMutation.mutateAsync(tag.id);
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

  const rows: ListRow[] = (tagsData || []).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color || "#3B82F6",
  }));

  const stats = [{ label: "Total Tags", value: isLoading ? "…" : String(tagsData?.length || 0) }];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Metadata & Classification"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canManage ? "Create Tag" : ""}
        children={
          canManage ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Create Tag
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Classification Tag</DialogTitle>
            <DialogDescription>Define tag name and visual badge color.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTag} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Tag Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Badge Color (Hex)</Label>
              <Input
                type="color"
                className="h-9 p-1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Tag</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog
        open={Boolean(assigningTag)}
        onOpenChange={(open) => {
          if (!open) setAssigningTag(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Tag: {assigningTag?.name}</DialogTitle>
            <DialogDescription>
              Select customer, lead, or opportunity to attach tag.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignTag} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Target Entity Type</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as any);
                  setTargetId("");
                }}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="LEAD">Lead</option>
                <option value="OPPORTUNITY">Opportunity</option>
              </select>
            </div>
            <div>
              <Label>Select Entity *</Label>
              <select
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                <option value="">Select Target...</option>
                {targetType === "CUSTOMER" &&
                  customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerCode} - {c.name}
                    </option>
                  ))}
                {targetType === "LEAD" &&
                  leads?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.leadNumber} - {l.firstName}
                    </option>
                  ))}
                {targetType === "OPPORTUNITY" &&
                  opps?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.opportunityNumber} - {o.name}
                    </option>
                  ))}
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAssigningTag(null)}>
                Cancel
              </Button>
              <Button type="submit">Assign Tag</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

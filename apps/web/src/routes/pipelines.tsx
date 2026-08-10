import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useCrmPipelines,
  useCreateCrmPipeline,
  useUpdateCrmPipeline,
  useDeleteCrmPipeline,
  useAddPipelineStage,
  useDeletePipelineStage,
  type PipelineItem,
} from "@/hooks/queries/useCrmPipelines";
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
import { Plus, Edit2, Trash2, GitCommit } from "lucide-react";

const title = "Sales Pipelines & Stages";
const description = "Configure custom CRM deal pipelines, stage ordering, and win probabilities.";

export const Route = createFileRoute("/pipelines")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: PipelinesPage,
});

function PipelinesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];
  const canManage = permissions.includes("crm.manage_pipeline");

  const { data: pipelinesData, isLoading } = useCrmPipelines();
  const createPipelineMutation = useCreateCrmPipeline();
  const updatePipelineMutation = useUpdateCrmPipeline();
  const deletePipelineMutation = useDeleteCrmPipeline();
  const addStageMutation = useAddPipelineStage();
  const deleteStageMutation = useDeletePipelineStage();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<PipelineItem | null>(null);
  const [addingStagePipeline, setAddingStagePipeline] = useState<PipelineItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<"LEAD" | "OPPORTUNITY">("OPPORTUNITY");
  const [isDefault, setIsDefault] = useState(false);

  // Add Stage Form State
  const [stageName, setStageName] = useState("");
  const [stageProb, setStageProb] = useState<number>(50);
  const [stageColor, setStageColor] = useState("#3B82F6");

  const resetForm = () => {
    setName("");
    setType("OPPORTUNITY");
    setIsDefault(false);
    setErrorMsg(null);
  };

  const handleSavePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingPipeline) {
        await updatePipelineMutation.mutateAsync({
          id: editingPipeline.id,
          data: { name, isDefault },
        });
        setEditingPipeline(null);
      } else {
        await createPipelineMutation.mutateAsync({ name, type, isDefault });
        setIsAddOpen(false);
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingStagePipeline) return;
    setErrorMsg(null);
    try {
      await addStageMutation.mutateAsync({
        pipelineId: addingStagePipeline.id,
        data: {
          name: stageName,
          probability: Number(stageProb),
          color: stageColor,
        },
      });
      setAddingStagePipeline(null);
      setStageName("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add stage");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "name", header: "Pipeline Name" },
    { key: "type", header: "Pipeline Type" },
    { key: "stagesCount", header: "Stages Count" },
    { key: "isDefaultStr", header: "Is Default" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const pipe = pipelinesData?.find((p) => p.id === r["id"]);
        if (!pipe) return null;
        return (
          <div className="flex items-center gap-1">
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setAddingStagePipeline(pipe);
                  setStageName("");
                  setStageProb(50);
                  setStageColor("#3B82F6");
                  setErrorMsg(null);
                }}
              >
                <GitCommit className="mr-1 h-3 w-3" /> Add Stage
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditingPipeline(pipe);
                  setName(pipe.name);
                  setType(pipe.type);
                  setIsDefault(pipe.isDefault);
                  setErrorMsg(null);
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {canManage && !pipe.isDefault && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={async () => {
                  if (confirm(`Delete pipeline ${pipe.name}?`)) {
                    await deletePipelineMutation.mutateAsync(pipe.id);
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

  const rows: ListRow[] = (pipelinesData || []).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    stagesCount: `${p.stages?.length || 0} stages`,
    isDefaultStr: p.isDefault ? "Yes" : "No",
    status: p.status,
  }));

  const stats = [
    { label: "Total Pipelines", value: isLoading ? "…" : String(pipelinesData?.length || 0) },
    {
      label: "Active Stages",
      value: isLoading
        ? "…"
        : String(pipelinesData?.reduce((acc, p) => acc + (p.stages?.length || 0), 0) || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Pipeline Configuration"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canManage ? "Create Pipeline" : ""}
        children={
          canManage ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Create Pipeline
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create / Edit Pipeline Modal */}
      <Dialog
        open={isAddOpen || Boolean(editingPipeline)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingPipeline(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPipeline ? "Edit Pipeline" : "Create Deal Pipeline"}</DialogTitle>
            <DialogDescription>Define pipeline name and default status.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePipeline} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Pipeline Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {!editingPipeline && (
              <div>
                <Label>Pipeline Type</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="OPPORTUNITY">OPPORTUNITY</option>
                  <option value="LEAD">LEAD</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefaultPipe"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <Label htmlFor="isDefaultPipe" className="cursor-pointer">
                Set as Default Tenant Pipeline
              </Label>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingPipeline(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPipeline ? "Update Pipeline" : "Create Pipeline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Stage Modal */}
      <Dialog
        open={Boolean(addingStagePipeline)}
        onOpenChange={(open) => {
          if (!open) setAddingStagePipeline(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stage to {addingStagePipeline?.name}</DialogTitle>
            <DialogDescription>
              Set stage title, win probability, and badge color.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStage} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Stage Name *</Label>
              <Input required value={stageName} onChange={(e) => setStageName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Win Probability (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={stageProb}
                  onChange={(e) => setStageProb(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Badge Color (Hex)</Label>
                <Input
                  type="color"
                  className="h-9 p-1"
                  value={stageColor}
                  onChange={(e) => setStageColor(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddingStagePipeline(null)}>
                Cancel
              </Button>
              <Button type="submit">Add Stage</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

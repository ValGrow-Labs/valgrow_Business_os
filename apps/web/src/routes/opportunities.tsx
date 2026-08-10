import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useOpportunities,
  useCreateOpportunity,
  useUpdateOpportunity,
  useUpdateOpportunityStage,
  useDeleteOpportunity,
  type OpportunityItem,
} from "@/hooks/queries/useOpportunities";
import { useCrmPipelines } from "@/hooks/queries/useCrmPipelines";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useUsers } from "@/hooks/queries/useUsers";
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
import { Plus, Edit2, Trash2, ArrowRightLeft } from "lucide-react";

const title = "Sales Opportunities";
const description =
  "Track deals across pipeline stages, update win probabilities, and close sales.";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("crm.create");
  const canUpdate = permissions.includes("crm.update");
  const canDelete = permissions.includes("crm.delete");

  const { data: oppsData, isLoading } = useOpportunities();
  const { data: pipelines } = useCrmPipelines();
  const { data: customers } = useCustomers();
  const { data: users } = useUsers();

  const createOppMutation = useCreateOpportunity();
  const updateOppMutation = useUpdateOpportunity();
  const updateStageMutation = useUpdateOpportunityStage();
  const deleteOppMutation = useDeleteOpportunity();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<OpportunityItem | null>(null);
  const [stageChangingOpp, setStageChangingOpp] = useState<OpportunityItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [descriptionStr, setDescriptionStr] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [stageId, setStageId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [probability, setProbability] = useState<number>(50);
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  // Stage Change State
  const [selectedStageId, setSelectedStageId] = useState("");
  const [closeReason, setCloseReason] = useState("");

  const resetForm = () => {
    setCustomerId("");
    setName("");
    setDescriptionStr("");
    setPipelineId(pipelines?.[0]?.id || "");
    setStageId(pipelines?.[0]?.stages?.[0]?.id || "");
    setAssignedToId("");
    setEstimatedValue(0);
    setProbability(50);
    setExpectedCloseDate("");
    setErrorMsg(null);
  };

  const handleOpenEdit = (opp: OpportunityItem) => {
    setEditingOpp(opp);
    setCustomerId(opp.customerId);
    setName(opp.name);
    setDescriptionStr(opp.description || "");
    setPipelineId(opp.pipelineId);
    setStageId(opp.stageId);
    setAssignedToId(opp.assignedToId || "");
    setEstimatedValue(Number(opp.estimatedValue || 0));
    setProbability(Number(opp.probability || 50));
    setExpectedCloseDate(opp.expectedCloseDate ? (opp.expectedCloseDate.split("T")[0] ?? "") : "");
    setErrorMsg(null);
  };

  const handleSaveOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingOpp) {
        await updateOppMutation.mutateAsync({
          id: editingOpp.id,
          data: {
            name,
            description: descriptionStr || null,
            pipelineId,
            stageId,
            assignedToId: assignedToId || null,
            estimatedValue: Number(estimatedValue),
            probability: Number(probability),
            expectedCloseDate: expectedCloseDate || null,
          },
        });
        setEditingOpp(null);
      } else {
        await createOppMutation.mutateAsync({
          customerId,
          name,
          description: descriptionStr || null,
          pipelineId,
          stageId,
          assignedToId: assignedToId || null,
          estimatedValue: Number(estimatedValue),
          probability: Number(probability),
          expectedCloseDate: expectedCloseDate || null,
        });
        setIsAddOpen(false);
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const handleStageChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageChangingOpp || !selectedStageId) return;
    setErrorMsg(null);
    try {
      await updateStageMutation.mutateAsync({
        id: stageChangingOpp.id,
        data: {
          stageId: selectedStageId,
          ...(closeReason ? { closeReason } : {}),
        },
      });
      setStageChangingOpp(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Stage change failed");
    }
  };

  const selectedPipelineObj = pipelines?.find((p) => p.id === (pipelineId || pipelines[0]?.id));

  const columns: Column<ListRow>[] = [
    { key: "opportunityNumber", header: "Opportunity #" },
    { key: "name", header: "Deal Name" },
    { key: "customerName", header: "Customer" },
    { key: "stageName", header: "Stage" },
    { key: "probability", header: "Probability" },
    { key: "estimatedValue", header: "Est. Value" },
    { key: "assignedToName", header: "Assigned Rep" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const opp = oppsData?.find((o) => o.id === r["id"]);
        if (!opp) return null;
        return (
          <div className="flex items-center gap-1">
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setStageChangingOpp(opp);
                  setSelectedStageId(opp.stageId);
                  setCloseReason("");
                  setErrorMsg(null);
                }}
              >
                <ArrowRightLeft className="mr-1 h-3 w-3" /> Move Stage
              </Button>
            )}
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleOpenEdit(opp)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={async () => {
                  if (confirm(`Delete opportunity ${opp.opportunityNumber}?`)) {
                    await deleteOppMutation.mutateAsync(opp.id);
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

  const rows: ListRow[] = (oppsData || []).map((o) => ({
    id: o.id,
    opportunityNumber: o.opportunityNumber,
    name: o.name,
    customerName: o.customer?.name || "N/A",
    stageName: `${o.stage?.name || o.stageId} (${o.probability}%)`,
    probability: `${o.probability}%`,
    estimatedValue: `₹${Number(o.estimatedValue || 0).toLocaleString("en-IN")}`,
    assignedToName: o.assignedTo
      ? `${o.assignedTo.firstName} ${o.assignedTo.lastName || ""}`
      : "Unassigned",
    status: o.status,
  }));

  const stats = [
    {
      label: "Active Deals",
      value: isLoading ? "…" : String(oppsData?.filter((o) => o.status === "OPEN").length || 0),
    },
    {
      label: "Won Opportunities",
      value: isLoading ? "…" : String(oppsData?.filter((o) => o.status === "WON").length || 0),
    },
    {
      label: "Pipeline Value",
      value: isLoading
        ? "…"
        : `₹${(oppsData?.filter((o) => o.status === "OPEN").reduce((acc, o) => acc + Number(o.estimatedValue || 0), 0) || 0).toLocaleString("en-IN")}`,
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Pipeline Management"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canCreate ? "New Opportunity" : ""}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> New Opportunity
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create / Edit Modal */}
      <Dialog
        open={isAddOpen || Boolean(editingOpp)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingOpp(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingOpp ? "Edit Opportunity" : "New Sales Opportunity"}</DialogTitle>
            <DialogDescription>
              Link customer, set estimated deal size, and assign pipeline stage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveOpp} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            {!editingOpp && (
              <div>
                <Label>Customer *</Label>
                <select
                  required
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select Customer...</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Opportunity / Deal Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pipeline</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={pipelineId}
                  onChange={(e) => {
                    setPipelineId(e.target.value);
                    const pipe = pipelines?.find((p) => p.id === e.target.value);
                    if (pipe?.stages?.[0]) setStageId(pipe.stages[0].id);
                  }}
                >
                  {pipelines?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Pipeline Stage</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                >
                  {selectedPipelineObj?.stages?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.probability}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estimated Value (₹)</Label>
                <Input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Win Probability (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assigned Sales Rep</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName || ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Expected Close Date</Label>
                <Input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingOpp(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingOpp ? "Update Deal" : "Create Deal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stage Transition Modal */}
      <Dialog
        open={Boolean(stageChangingOpp)}
        onOpenChange={(open) => {
          if (!open) setStageChangingOpp(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move Opportunity Stage</DialogTitle>
            <DialogDescription>
              Select new pipeline stage for {stageChangingOpp?.opportunityNumber}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStageChange} className="space-y-4">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div>
              <Label>Target Stage</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
              >
                {pipelines
                  ?.find((p) => p.id === stageChangingOpp?.pipelineId)
                  ?.stages?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.probability}% Win Probability
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label>Close Reason / Transition Note</Label>
              <Input
                placeholder="Optional notes for winning/losing deal..."
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setStageChangingOpp(null)}>
                Cancel
              </Button>
              <Button type="submit">Update Stage</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

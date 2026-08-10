import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useCrmActivities,
  useCreateCrmActivity,
  useUpdateCrmActivity,
  useDeleteCrmActivity,
  type CrmActivityItem,
} from "@/hooks/queries/useCrmActivities";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useLeads } from "@/hooks/queries/useLeads";
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
import { Plus, Edit2, Trash2 } from "lucide-react";

const title = "CRM Activities";
const description = "Track customer meetings, calls, demos, site visits, and interaction history.";

export const Route = createFileRoute("/activities")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("crm.create");
  const canUpdate = permissions.includes("crm.update");
  const canDelete = permissions.includes("crm.delete");

  const { data: activitiesData, isLoading } = useCrmActivities();
  const { data: customers } = useCustomers();
  const { data: leads } = useLeads();
  const { data: users } = useUsers();

  const createActivityMutation = useCreateCrmActivity();
  const updateActivityMutation = useUpdateCrmActivity();
  const deleteActivityMutation = useDeleteCrmActivity();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CrmActivityItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<CrmActivityItem["type"]>("MEETING");
  const [subject, setSubject] = useState("");
  const [descriptionStr, setDescriptionStr] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [activityDate, setActivityDate] = useState("");
  const [priority, setPriority] = useState<CrmActivityItem["priority"]>("MEDIUM");
  const [status, setStatus] = useState<CrmActivityItem["status"]>("COMPLETED");
  const [customerId, setCustomerId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const resetForm = () => {
    setType("MEETING");
    setSubject("");
    setDescriptionStr("");
    setDurationMinutes(30);
    setActivityDate(new Date().toISOString().split("T")[0] || "");
    setPriority("MEDIUM");
    setStatus("COMPLETED");
    setCustomerId("");
    setLeadId("");
    setAssignedToId("");
    setErrorMsg(null);
  };

  const handleOpenEdit = (act: CrmActivityItem) => {
    setEditingActivity(act);
    setType(act.type);
    setSubject(act.subject);
    setDescriptionStr(act.description || "");
    setDurationMinutes(act.durationMinutes || 30);
    setActivityDate(act.activityDate ? act.activityDate.split("T")[0] || "" : "");
    setPriority(act.priority);
    setStatus(act.status);
    setCustomerId(act.customerId || "");
    setLeadId(act.leadId || "");
    setAssignedToId(act.assignedToId || "");
    setErrorMsg(null);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingActivity) {
        await updateActivityMutation.mutateAsync({
          id: editingActivity.id,
          data: {
            type,
            subject,
            description: descriptionStr || null,
            durationMinutes: Number(durationMinutes),
            ...(activityDate ? { activityDate } : {}),
            priority,
            status,
            assignedToId: assignedToId || null,
          },
        });
        setEditingActivity(null);
      } else {
        await createActivityMutation.mutateAsync({
          type,
          subject,
          description: descriptionStr || null,
          durationMinutes: Number(durationMinutes),
          ...(activityDate ? { activityDate } : {}),
          priority,
          status,
          customerId: customerId || null,
          leadId: leadId || null,
          assignedToId: assignedToId || null,
        });
        setIsAddOpen(false);
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "type", header: "Type" },
    { key: "subject", header: "Subject" },
    { key: "assignedToName", header: "Assigned To" },
    { key: "activityDate", header: "Date" },
    { key: "priority", header: "Priority" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const act = activitiesData?.find((a) => a.id === r["id"]);
        if (!act) return null;
        return (
          <div className="flex items-center gap-1">
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleOpenEdit(act)}
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
                  if (confirm(`Delete activity ${act.subject}?`)) {
                    await deleteActivityMutation.mutateAsync(act.id);
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

  const rows: ListRow[] = (activitiesData || []).map((a) => ({
    id: a.id,
    type: a.type,
    subject: a.subject,
    assignedToName: a.assignedTo
      ? `${a.assignedTo.firstName} ${a.assignedTo.lastName || ""}`
      : "Unassigned",
    activityDate: new Date(a.activityDate).toLocaleDateString(),
    priority: a.priority,
    status: a.status,
  }));

  const stats = [
    { label: "Total Activities", value: isLoading ? "…" : String(activitiesData?.length || 0) },
    {
      label: "Meetings & Calls",
      value: isLoading
        ? "…"
        : String(
            activitiesData?.filter((a) => a.type === "MEETING" || a.type === "CALL").length || 0,
          ),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Activity Tracking"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canCreate ? "Log Activity" : ""}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Log Activity
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create / Edit Modal */}
      <Dialog
        open={isAddOpen || Boolean(editingActivity)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingActivity(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Edit Activity Log" : "Log CRM Activity"}</DialogTitle>
            <DialogDescription>
              Record interactions with customers, leads, or deals.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveActivity} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Activity Type *</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  {["CALL", "EMAIL", "MEETING", "NOTE", "TASK", "FOLLOW_UP", "DEMO", "VISIT"].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Subject *</Label>
              <Input required value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>Description / Summary</Label>
              <Input value={descriptionStr} onChange={(e) => setDescriptionStr(e.target.value)} />
            </div>
            {!editingActivity && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Link to Customer</Label>
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
                  <Label>Link to Lead</Label>
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
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assigned Rep</Label>
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
                <Label>Activity Date</Label>
                <Input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingActivity(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingActivity ? "Update Activity" : "Save Activity"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

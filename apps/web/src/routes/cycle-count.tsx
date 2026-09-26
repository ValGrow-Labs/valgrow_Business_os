import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardCheck,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCheck,
  Building2,
  Package,
} from "lucide-react";
import {
  useCycleCounts,
  useCycleCountById,
  useCreateCycleCount,
  useUpdateCountItems,
  usePostCycleCountVariances,
  type CycleCountStatus,
  type CycleCountSummaryItem,
  type CycleCountDetailItem,
} from "@/hooks/queries/useCycleCounts";
import { useWarehouses } from "@/hooks/queries/useWarehouses";

const title = "Physical Cycle Counting";
const description =
  "Structured shelf & bin physical inventory counting sessions with automated discrepancy resolution.";

export const Route = createFileRoute("/cycle-count")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: CycleCountPage,
});

function StatusBadge({ status }: { status: CycleCountStatus }) {
  if (status === "POSTED") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2">
        Posted (Adjusted)
      </Badge>
    );
  }
  if (status === "COMPLETED") {
    return (
      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium px-2">
        Ready for Posting
      </Badge>
    );
  }
  if (status === "COUNTING") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium px-2">
        Counting in Progress
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground px-2">
      Draft Sheet
    </Badge>
  );
}

function CycleCountPage() {
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState<string>("");

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { data: warehousesData } = useWarehouses();
  const { data: sessionsList } = useCycleCounts();
  const { data: activeSessionDetail } = useCycleCountById(activeSessionId || "");

  const createMutation = useCreateCycleCount();
  const updateItemsMutation = useUpdateCountItems();
  const postVariancesMutation = usePostCycleCountVariances();

  // Local state for counts inside the active sheet
  const [countsMap, setCountsMap] = useState<Record<string, string>>({});

  const handleOpenSession = (session: CycleCountSummaryItem) => {
    setActiveSessionId(session.id);
  };

  const handleCreateSession = async () => {
    if (!selectedWarehouseId) return;
    const payload: { warehouseId: string; notes?: string } = {
      warehouseId: selectedWarehouseId,
    };
    if (sessionNotes.trim()) {
      payload.notes = sessionNotes.trim();
    }
    await createMutation.mutateAsync(payload);
    setNewModalOpen(false);
    setSelectedWarehouseId("");
    setSessionNotes("");
  };

  const handleSaveCounts = async () => {
    if (!activeSessionId || !activeSessionDetail) return;

    const itemsToUpdate = Object.entries(countsMap)
      .map(([itemId, qtyStr]) => {
        const num = Number(qtyStr);
        if (isNaN(num)) return null;
        return { itemId, countedQty: Math.max(0, num) };
      })
      .filter(Boolean) as { itemId: string; countedQty: number }[];

    if (itemsToUpdate.length === 0) return;

    await updateItemsMutation.mutateAsync({
      id: activeSessionId,
      items: itemsToUpdate,
    });

    setCountsMap({});
  };

  const handlePostVariances = async () => {
    if (!activeSessionId) return;
    await postVariancesMutation.mutateAsync(activeSessionId);
  };

  const sessions = sessionsList || [];
  const inProgressCount = sessions.filter((s) => s.status === "COUNTING").length;
  const readyPostCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const postedCount = sessions.filter((s) => s.status === "POSTED").length;

  const stats = [
    {
      label: "Total Counting Sessions",
      value: String(sessions.length),
      hint: "Physical floor audit sessions",
    },
    {
      label: "In-Progress Counts",
      value: String(inProgressCount),
      hint: "Currently being counted",
    },
    {
      label: "Pending Posting",
      value: String(readyPostCount),
      hint: "Awaiting variance posting",
    },
    {
      label: "Completed & Posted",
      value: String(postedCount),
      hint: "Variances posted to ledger",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Inventory Operations"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
              <Link to="/inventory">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Back to Stock</span>
                <span className="sm:hidden">Stock</span>
              </Link>
            </Button>
            <Button size="sm" onClick={() => setNewModalOpen(true)} className="text-xs sm:text-sm">
              <Plus className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>New Count Sheet</span>
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            {...(s.hint ? { hint: s.hint } : {})}
            tone={i === 2 && readyPostCount > 0 ? "brand" : i === 0 ? "brand" : "default"}
          />
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base">Cycle Count Sheets &amp; Audits</h3>
            <p className="text-xs text-muted-foreground">
              Select a session sheet to enter physical counts or review discrepancies.
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <h4 className="font-semibold text-base text-foreground">No Cycle Counts Initiated</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Create a new physical count sheet for a warehouse to snapshot system inventory and audit physical bins.
            </p>
            <Button size="sm" className="mt-4" onClick={() => setNewModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Start First Cycle Count
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Count Sheet #</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items Counted</TableHead>
                  <TableHead>Discrepancies</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-bold text-foreground">
                      {s.countNumber}
                    </TableCell>
                    <TableCell className="font-medium">{s.warehouseName}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {s.countedItems} / {s.totalItems} Items
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {s.varianceItems > 0 ? (
                        <span className="text-amber-600 font-bold">⚠️ {s.varianceItems} Variances</span>
                      ) : (
                        <span className="text-emerald-600">Matched</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleOpenSession(s)}
                      >
                        <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                        Open Sheet
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ─── Modal 1: Create New Cycle Count Session ─────────────────────── */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-brand" />
              New Cycle Count Sheet
            </DialogTitle>
            <DialogDescription>
              Snapshot system inventory for a warehouse to begin physical shelf and bin counts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Target Warehouse</label>
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Warehouse…" />
                </SelectTrigger>
                <SelectContent>
                  {warehousesData?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Session Notes (Optional)</label>
              <Input
                placeholder="e.g. Q3 Shelf A-F Audit"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSession} disabled={!selectedWarehouseId || createMutation.isPending}>
              {createMutation.isPending ? "Initializing…" : "Generate Sheet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Count Sheet Input & Variance Review ─────────────────── */}
      <Dialog open={Boolean(activeSessionId)} onOpenChange={(open) => !open && setActiveSessionId(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[850px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-lg">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-brand" />
                Sheet: {activeSessionDetail?.countNumber}
              </div>
              {activeSessionDetail && <StatusBadge status={activeSessionDetail.status} />}
            </DialogTitle>
            <DialogDescription>
              Warehouse: <strong>{activeSessionDetail?.warehouseName}</strong> · Enter physical counts below.
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-md overflow-x-auto my-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product &amp; SKU</TableHead>
                  <TableHead>Location Bin</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>System Qty</TableHead>
                  <TableHead className="w-36">Physical Count</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!activeSessionDetail?.items || activeSessionDetail.items.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No stock levels found in this warehouse to count.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeSessionDetail.items.map((item: CycleCountDetailItem) => {
                    const currentVal = countsMap[item.id] !== undefined
                      ? countsMap[item.id]
                      : item.countedQty !== null
                      ? String(item.countedQty)
                      : "";

                    const numVal = currentVal !== "" ? Number(currentVal) : null;
                    const diff = numVal !== null ? numVal - item.systemQty : item.variance;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">{item.productSku}</div>
                        </TableCell>
                        <TableCell className="text-xs">{item.locationName}</TableCell>
                        <TableCell className="text-xs font-mono">{item.batchNumber}</TableCell>
                        <TableCell className="font-mono font-semibold">{item.systemQty}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 font-mono"
                            placeholder="Count…"
                            value={currentVal}
                            disabled={activeSessionDetail.status === "POSTED"}
                            onChange={(e) =>
                              setCountsMap({ ...countsMap, [item.id]: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {diff === null ? (
                            <span className="text-muted-foreground text-xs italic">Uncounted</span>
                          ) : diff === 0 ? (
                            <span className="text-emerald-600 font-medium">0 (Match)</span>
                          ) : diff > 0 ? (
                            <span className="text-amber-600 font-bold">+{diff} Surplus</span>
                          ) : (
                            <span className="text-destructive font-bold">{diff} Shortage</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setActiveSessionId(null)}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              {activeSessionDetail?.status !== "POSTED" && (
                <Button
                  variant="outline"
                  onClick={handleSaveCounts}
                  disabled={updateItemsMutation.isPending}
                >
                  {updateItemsMutation.isPending ? "Saving…" : "Save Physical Counts"}
                </Button>
              )}

              {activeSessionDetail?.status === "COMPLETED" && (
                <Button
                  onClick={handlePostVariances}
                  disabled={postVariancesMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {postVariancesMutation.isPending ? "Posting…" : "Post Variances to Stock Adjustments"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

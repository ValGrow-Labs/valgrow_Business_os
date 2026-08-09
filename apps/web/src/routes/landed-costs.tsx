import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useLandedCosts, useCreateLandedCost } from "@/hooks/queries/useLandedCosts";
import { useGoodsReceipts } from "@/hooks/queries/useGoodsReceipts";
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
import { Plus } from "lucide-react";

const title = "Landed Costs";
const description =
  "Freight, customs, insurance, and duty allocations directly applied to inventory valuation.";

export const Route = createFileRoute("/landed-costs")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: LandedCostsPage,
});

function LandedCostsPage() {
  const { data: landedCosts } = useLandedCosts();
  const { data: postedGRNs } = useGoodsReceipts("POSTED");

  const createLandedCostMutation = useCreateLandedCost();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [grnId, setGRNId] = useState("");
  const [costType, setCostType] = useState<"FREIGHT" | "CUSTOMS" | "INSURANCE" | "DUTY" | "OTHER">(
    "FREIGHT",
  );
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");

  const handleCreate = async () => {
    if (!grnId || amount <= 0) return;
    await createLandedCostMutation.mutateAsync({
      goodsReceiptId: grnId,
      costType,
      amount: Number(amount),
      notes: notes || undefined,
    });
    setIsAddOpen(false);
    setAmount(0);
    setNotes("");
  };

  const columns: Column<ListRow>[] = [
    { key: "grnNumber", header: "Goods Receipt #" },
    { key: "costType", header: "Cost Type" },
    { key: "amount", header: "Amount" },
    { key: "notes", header: "Notes" },
    { key: "createdAt", header: "Allocation Date" },
  ];

  const rows: ListRow[] = landedCosts
    ? landedCosts.map((lc) => ({
        id: lc.id,
        grnNumber: lc.goodsReceipt ? lc.goodsReceipt.receiptNumber : "N/A",
        costType: lc.costType,
        amount: `₹${Number(lc.amount).toLocaleString("en-IN")}`,
        notes: lc.notes || "N/A",
        createdAt: new Date(lc.createdAt).toLocaleDateString(),
      }))
    : [];

  const stats = [
    { label: "Total Landed Costs", value: String(landedCosts?.length || 0) },
    {
      label: "Total Allocated Amount",
      value: `₹${landedCosts?.reduce((s, l) => s + Number(l.amount), 0).toLocaleString("en-IN") || 0}`,
    },
    {
      label: "Freight Allocations",
      value: String(landedCosts?.filter((l) => l.costType === "FREIGHT").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Inventory Valuation"
        actionLabel="Allocate Landed Cost"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Allocate Landed Cost
            </Button>
          </div>
        }
      />

      {/* Add Landed Cost Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Allocate Landed Cost</DialogTitle>
            <DialogDescription>
              Distribute ancillary shipping or duty costs proportionally across POSTED GRN inventory
              items.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Target POSTED Goods Receipt *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={grnId}
                onChange={(e) => setGRNId(e.target.value)}
              >
                <option value="">Select Goods Receipt</option>
                {postedGRNs?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.receiptNumber} ({g.supplier?.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Cost Category *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={costType}
                onChange={(e) => setCostType(e.target.value as any)}
              >
                <option value="FREIGHT">FREIGHT</option>
                <option value="CUSTOMS">CUSTOMS</option>
                <option value="DUTY">DUTY</option>
                <option value="INSURANCE">INSURANCE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Cost Amount (₹) *</Label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="e.g. 5000"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes / Reference</Label>
              <Input
                placeholder="e.g. Bill of lading freight invoice #FL-991"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLandedCostMutation.isPending || !grnId || amount <= 0}
            >
              {createLandedCostMutation.isPending ? "Allocating…" : "Allocate Cost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

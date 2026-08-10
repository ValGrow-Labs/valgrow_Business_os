import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCostCenters, useCreateCostCenter } from "@/hooks/queries/useCostCenters";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/cost-centers")({
  head: () => ({
    meta: [{ title: "Cost Centers · ValGrow Business OS" }],
  }),
  component: CostCentersPage,
});

function CostCentersPage() {
  const { data: costCenters, isLoading } = useCostCenters();
  const createMutation = useCreateCostCenter();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        setShowCreate(false);
        setFormData({ code: "", name: "", description: "" });
      },
    });
  };

  const filtered = costCenters?.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  ) || [];

  return (
    <AppShell>
      <PageHeader
        title="Cost Centers"
        description="Departmental and project cost centers for managerial accounting allocation."
        eyebrow="Cost Accounting"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" /> Add Cost Center
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6 border-primary/20 bg-accent/10">
          <CardHeader>
            <CardTitle>Create Cost Center</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Code</label>
                <Input
                  required
                  placeholder="CC-MKTG"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Name</label>
                <Input
                  required
                  placeholder="Marketing & Digital Ads"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Description</label>
                <Input
                  placeholder="Optional notes"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Save Cost Center
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code or name..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} cost centers</span>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Cost Center Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Loading Cost Centers...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No Cost Centers found.
                </td>
              </tr>
            ) : (
              filtered.map((cc) => (
                <tr key={cc.id} className="hover:bg-accent/5">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{cc.code}</td>
                  <td className="px-4 py-3 font-medium">{cc.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cc.description || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={cc.status === "ACTIVE" ? "default" : "secondary"}>
                      {cc.status}
                    </Badge>
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

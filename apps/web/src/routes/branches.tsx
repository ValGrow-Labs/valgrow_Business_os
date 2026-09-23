import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useBranches, useCreateBranch } from "@/hooks/queries/useBranches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Branch" },
  { key: "city", header: "City" },
  { key: "lead", header: "Branch lead" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

const title = "Branch Management";
const description = "Create, group and configure branches that every future module will inherit.";

export const Route = createFileRoute("/branches")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: BranchManagementPage,
});

function BranchManagementPage() {
  const { data: branchesData } = useBranches();
  const createBranchMutation = useCreateBranch();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setCode("");
    setCity("");
    setAddress("");
    setPhone("");
    setEmail("");
    setStatus("ACTIVE");
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError("Branch Name is required");
      return;
    }

    setValidationError(null);
    createBranchMutation.mutate(
      {
        name: name.trim(),
        code: code.trim() || null,
        city: city.trim() || "Bengaluru",
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        status,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          resetForm();
        },
      },
    );
  };

  const rows: ListRow[] = branchesData
    ? branchesData.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.city || "N/A",
        lead: b.manager ? `${b.manager.firstName} ${b.manager.lastName}` : "Unassigned",
        status: b.status === "ACTIVE" ? "Active" : "Draft",
      }))
    : [];

  const stats = [
    { label: "Branches", value: String(branchesData?.length || 0), hint: "Operational & Draft" },
    {
      label: "Active",
      value: String(branchesData?.filter((b) => b.status === "ACTIVE").length || 0),
    },
    {
      label: "Draft",
      value: String(branchesData?.filter((b) => b.status === "DRAFT").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Organization"
        actionLabel="New branch"
        onAction={() => setShowModal(true)}
        stats={stats}
        columns={columns}
        rows={rows}
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Add a new operational branch for your organization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="branch-name">Branch Name *</Label>
              <Input
                id="branch-name"
                placeholder="e.g. Main Branch"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="branch-code">Branch Code</Label>
                <Input
                  id="branch-code"
                  placeholder="e.g. BR-MAIN"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="branch-city">City</Label>
                <Input
                  id="branch-city"
                  placeholder="e.g. Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="branch-address">Address</Label>
              <Input
                id="branch-address"
                placeholder="e.g. 123 MG Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="branch-phone">Phone</Label>
                <Input
                  id="branch-phone"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="branch-email">Email</Label>
                <Input
                  id="branch-email"
                  type="email"
                  placeholder="e.g. main@valgrow.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="branch-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="branch-status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(validationError || createBranchMutation.isError) && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                {validationError ||
                  (createBranchMutation.error as any)?.message ||
                  "Failed to create branch"}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBranchMutation.isPending}>
                {createBranchMutation.isPending ? "Creating..." : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


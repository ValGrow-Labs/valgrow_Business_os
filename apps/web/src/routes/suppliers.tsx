import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  type SupplierItem,
} from "@/hooks/queries/useSuppliers";
import {
  useSupplierContacts,
  useCreateSupplierContact,
  useDeleteSupplierContact,
} from "@/hooks/queries/useSupplierContacts";
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
import { Plus, Trash2, Eye } from "lucide-react";

const title = "Suppliers";
const description = "Supplier profiles, payment terms, contact details, and vendor relationships.";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const { data: suppliersData } = useSuppliers();
  const createSupplierMutation = useCreateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  // Form State for Supplier
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("India");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paymentTerms, setPaymentTerms] = useState("NET30");

  const resetForm = () => {
    setName("");
    setCode("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setCountry("India");
    setTaxIdNumber("");
    setCurrency("INR");
    setPaymentTerms("NET30");
  };

  const handleCreate = async () => {
    if (!name || !code) return;
    await createSupplierMutation.mutateAsync({
      name,
      code,
      contactPerson: contactPerson || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
      taxIdNumber: taxIdNumber || null,
      currency,
      paymentTerms,
    });
    setIsAddOpen(false);
    resetForm();
  };

  const columns: Column<ListRow>[] = [
    { key: "code", header: "Supplier Code" },
    { key: "name", header: "Supplier Name" },
    { key: "contactPerson", header: "Contact Person" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "country", header: "Country" },
    { key: "paymentTerms", header: "Payment Terms" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = suppliersData?.find((s) => s.id === r["id"]);
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => item && setSelectedSupplier(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => item && deleteSupplierMutation.mutate(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = suppliersData
    ? suppliersData.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        contactPerson: s.contactPerson || "N/A",
        email: s.email || "N/A",
        phone: s.phone || "N/A",
        country: s.country || "India",
        paymentTerms: s.paymentTerms || "NET30",
        status: s.status === "ACTIVE" ? "Active" : "Inactive",
      }))
    : [];

  const stats = [
    { label: "Total Suppliers", value: String(suppliersData?.length || 0) },
    {
      label: "Active Vendors",
      value: String(suppliersData?.filter((s) => s.status === "ACTIVE").length || 0),
    },
    {
      label: "Domestic (India)",
      value: String(suppliersData?.filter((s) => !s.country || s.country === "India").length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Purchasing & Vendors"
        actionLabel="New supplier"
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Supplier
            </Button>
          </div>
        }
      />

      {/* Create Supplier Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Register a new vendor for purchase orders and inventory sourcing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Components Ltd"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Supplier Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SUP-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / GSTIN</Label>
              <Input
                id="taxId"
                value={taxIdNumber}
                onChange={(e) => setTaxIdNumber(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bengaluru"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createSupplierMutation.isPending || !name || !code}
            >
              {createSupplierMutation.isPending ? "Creating…" : "Save Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Details & Contacts Dialog */}
      {selectedSupplier && (
        <SupplierDetailsModal
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </>
  );
}

function SupplierDetailsModal({
  supplier,
  onClose,
}: {
  supplier: SupplierItem;
  onClose: () => void;
}) {
  const { data: contacts } = useSupplierContacts(supplier.id);
  const createContactMutation = useCreateSupplierContact(supplier.id);
  const deleteContactMutation = useDeleteSupplierContact(supplier.id);

  const [cName, setCName] = useState("");
  const [cRole, setCRole] = useState("");
  const [cEmail, CSetEmail] = useState("");
  const [cPhone, setCPhone] = useState("");

  const handleAddContact = async () => {
    if (!cName) return;
    await createContactMutation.mutateAsync({
      name: cName,
      role: cRole || null,
      email: cEmail || null,
      phone: cPhone || null,
    });
    setCName("");
    setCRole("");
    CSetEmail("");
    setCPhone("");
  };

  return (
    <Dialog open={Boolean(supplier)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {supplier.name} ({supplier.code})
          </DialogTitle>
          <DialogDescription>
            Supplier profile, tax information, and primary contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-3 text-sm border-b pb-4">
          <div>
            <span className="text-muted-foreground block text-xs">Tax ID / GST</span>
            <span className="font-medium">{supplier.taxIdNumber || "N/A"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Currency</span>
            <span className="font-medium">{supplier.currency}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Payment Terms</span>
            <span className="font-medium">{supplier.paymentTerms || "NET30"}</span>
          </div>
        </div>

        {/* Contacts Section */}
        <div className="space-y-4 pt-2">
          <h4 className="font-semibold text-sm">Supplier Contacts</h4>

          <div className="grid gap-2 sm:grid-cols-4">
            <Input
              placeholder="Contact Name"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
            />
            <Input
              placeholder="Role / Title"
              value={cRole}
              onChange={(e) => setCRole(e.target.value)}
            />
            <Input placeholder="Email" value={cEmail} onChange={(e) => CSetEmail(e.target.value)} />
            <Button
              size="sm"
              onClick={handleAddContact}
              disabled={createContactMutation.isPending || !cName}
            >
              Add Contact
            </Button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {contacts && contacts.length > 0 ? (
              contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border rounded p-2 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {c.name} {c.role ? `(${c.role})` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.email || "No email"} • {c.phone || "No phone"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteContactMutation.mutate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No contacts added yet.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

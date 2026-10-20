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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
import { CurrencySelect } from "@/components/ui/currency-select";
import { CountrySelect } from "@/components/ui/country-select";

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
  const { currencyCode } = useActiveCurrency();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("India");
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [currency, setCurrency] = useState(currencyCode || "INR");
  const [paymentTerms, setPaymentTerms] = useState("NET30");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);

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
    setCurrency(currencyCode || "INR");
    setPaymentTerms("NET30");
    setNotes("");
    setStatus("ACTIVE");
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Supplier Name is required.");
      return;
    }

    if (!code.trim()) {
      setFormError("Supplier Code is required.");
      return;
    }

    try {
      await createSupplierMutation.mutateAsync({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPerson: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        taxIdNumber: taxIdNumber.trim() || null,
        currency,
        paymentTerms,
        notes: notes.trim() || null,
        status,
      });
      toast.success(`Supplier "${name.trim()}" created successfully!`);
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      const msg = err?.message || "Failed to create supplier.";
      setFormError(msg);
      toast.error(msg);
    }
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
        onAction={handleOpenAdd}
        stats={stats}
        columns={columns}
        rows={rows}
      />

      {/* Create Supplier Dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[95vw] sm:max-w-[650px] p-0 flex flex-col overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-4 border-b shrink-0 text-left">
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Register a new vendor for purchase orders and inventory sourcing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs rounded border border-destructive/40 bg-destructive/10 text-destructive font-medium">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Supplier Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Components Ltd"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="code">
                    Supplier Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SUP-001"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="taxId">Tax ID / GSTIN</Label>
                  <Input
                    id="taxId"
                    value={taxIdNumber}
                    onChange={(e) => setTaxIdNumber(e.target.value)}
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <CountrySelect
                    id="country"
                    value={country}
                    onValueChange={(val) => setCountry(val)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={(val) => setPaymentTerms(val)}>
                    <SelectTrigger id="paymentTerms">
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NET30">Net 30 Days</SelectItem>
                      <SelectItem value="NET15">Net 15 Days</SelectItem>
                      <SelectItem value="NET45">Net 45 Days</SelectItem>
                      <SelectItem value="NET60">Net 60 Days</SelectItem>
                      <SelectItem value="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                      <SelectItem value="CASH_ON_DELIVERY">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <CurrencySelect
                    id="currency"
                    value={currency}
                    onValueChange={(val) => setCurrency(val)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val: "ACTIVE" | "INACTIVE") => setStatus(val)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address / Landmark"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Notes / Vendor References</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about supplier categories, preferred contact times, or agreements..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 sm:px-6 border-t bg-popover shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSupplierMutation.isPending || !name.trim() || !code.trim()}
              >
                {createSupplierMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createSupplierMutation.isPending ? "Saving..." : "Save Supplier"}
              </Button>
            </DialogFooter>
          </form>
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
      <DialogContent className="max-h-[90dvh] w-[95vw] sm:max-w-[700px] p-0 flex flex-col overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 text-left">
          <DialogTitle>
            {supplier.name} ({supplier.code})
          </DialogTitle>
          <DialogDescription>
            Supplier profile, tax information, and primary contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 text-sm border-b pb-4">
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

            <div className="grid gap-2 grid-cols-1 sm:grid-cols-4">
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
              <Input
                placeholder="Email"
                value={cEmail}
                onChange={(e) => CSetEmail(e.target.value)}
              />
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
        </div>

        <DialogFooter className="p-4 sm:px-6 border-t bg-popover shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

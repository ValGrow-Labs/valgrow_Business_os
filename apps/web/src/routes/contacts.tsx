import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useCustomerContacts,
  useCreateCustomerContact,
  useUpdateCustomerContact,
  useDeleteCustomerContact,
  type CustomerContactItem,
} from "@/hooks/queries/useCustomerContacts";
import { useCustomers } from "@/hooks/queries/useCustomers";
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

const title = "Customer Contacts";
const description =
  "Manage contact persons, decision makers, and key representatives per customer.";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("crm.create");
  const canUpdate = permissions.includes("crm.update");
  const canDelete = permissions.includes("crm.delete");

  const { data: customers } = useCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const activeCustId = selectedCustomerId || customers?.[0]?.id || "";
  const { data: contactsData, isLoading } = useCustomerContacts(activeCustId);
  const createContactMutation = useCreateCustomerContact();
  const updateContactMutation = useUpdateCustomerContact();
  const deleteContactMutation = useDeleteCustomerContact();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomerContactItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setCustomerId(activeCustId);
    setName("");
    setRole("");
    setEmail("");
    setPhone("");
    setIsPrimary(false);
    setNotes("");
    setErrorMsg(null);
  };

  const handleOpenEdit = (contact: CustomerContactItem) => {
    setEditingContact(contact);
    setCustomerId(contact.customerId);
    setName(contact.name);
    setRole(contact.role || "");
    setEmail(contact.email || "");
    setPhone(contact.phone || "");
    setIsPrimary(contact.isPrimary);
    setNotes(contact.notes || "");
    setErrorMsg(null);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingContact) {
        await updateContactMutation.mutateAsync({
          id: editingContact.id,
          customerId: editingContact.customerId,
          data: {
            name,
            role: role || null,
            email: email || null,
            phone: phone || null,
            isPrimary,
            notes: notes || null,
          },
        });
        setEditingContact(null);
      } else {
        await createContactMutation.mutateAsync({
          customerId: customerId || activeCustId,
          name,
          role: role || null,
          email: email || null,
          phone: phone || null,
          isPrimary,
          notes: notes || null,
        });
        setIsAddOpen(false);
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "name", header: "Contact Name" },
    { key: "role", header: "Role / Title" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "isPrimary", header: "Primary" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const contact = contactsData?.find((c) => c.id === r["id"]);
        if (!contact) return null;
        return (
          <div className="flex items-center gap-1">
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleOpenEdit(contact)}
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
                  if (confirm(`Delete contact ${contact.name}?`)) {
                    await deleteContactMutation.mutateAsync({
                      id: contact.id,
                      customerId: contact.customerId,
                    });
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

  const rows: ListRow[] = (contactsData || []).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role || "N/A",
    email: c.email || "N/A",
    phone: c.phone || "N/A",
    isPrimary: c.isPrimary ? "Yes" : "No",
  }));

  const stats = [
    { label: "Registered Contacts", value: isLoading ? "…" : String(contactsData?.length || 0) },
    {
      label: "Primary Decision Makers",
      value: isLoading ? "…" : String(contactsData?.filter((c) => c.isPrimary).length || 0),
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Relationship Contacts"
        stats={stats}
        columns={columns}
        rows={rows}
        actionLabel={canCreate ? "New Contact" : ""}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs">
                <Label>Filter Customer:</Label>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={activeCustId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Contact
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create / Edit Modal */}
      <Dialog
        open={isAddOpen || Boolean(editingContact)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingContact(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "New Customer Contact"}</DialogTitle>
            <DialogDescription>Add key decision maker or contact person.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveContact} className="space-y-3">
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
            {!editingContact && (
              <div>
                <Label>Customer *</Label>
                <select
                  required
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={customerId || activeCustId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Full Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Job Role / Position</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrimaryContact"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
              />
              <Label htmlFor="isPrimaryContact" className="cursor-pointer">
                Mark as Primary Contact Person
              </Label>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingContact(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingContact ? "Update Contact" : "Save Contact"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

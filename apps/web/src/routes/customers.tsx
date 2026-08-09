import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type CustomerItem,
} from "@/hooks/queries/useCustomers";
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
import { Plus, Trash2, Eye, Edit2 } from "lucide-react";

const title = "Customers";
const description = "Customer Directory, credit limits, contact information, and billing terms.";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: currentUser } = useCurrentUser();
  const permissions = currentUser?.permissions || [];

  const canCreate = permissions.includes("sales.create");
  const canUpdate = permissions.includes("sales.update");
  const canDelete = permissions.includes("sales.delete");

  const { data: customersData, isLoading } = useCustomers();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [customerCode, setCustomerCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [postalCode, setPostalCode] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("NET30");

  const resetForm = () => {
    setCustomerCode("");
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("India");
    setPostalCode("");
    setTaxNumber("");
    setCurrency("INR");
    setCreditLimit(0);
    setPaymentTerms("NET30");
    setErrorMsg(null);
  };

  const handleOpenEdit = (customer: CustomerItem) => {
    setEditingCustomer(customer);
    setCustomerCode(customer.customerCode);
    setName(customer.name);
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setAddress(customer.address || "");
    setCity(customer.city || "");
    setState(customer.state || "");
    setCountry(customer.country || "India");
    setPostalCode(customer.postalCode || "");
    setTaxNumber(customer.taxNumber || "");
    setCurrency(customer.currency || "INR");
    setCreditLimit(customer.creditLimit || 0);
    setPaymentTerms(customer.paymentTerms || "NET30");
    setErrorMsg(null);
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!customerCode || !name) return;
    setErrorMsg(null);
    try {
      if (editingCustomer) {
        await updateCustomerMutation.mutateAsync({
          id: editingCustomer.id,
          data: {
            name,
            email: email || null,
            phone: phone || null,
            address: address || null,
            city: city || null,
            state: state || null,
            country: country || null,
            postalCode: postalCode || null,
            taxNumber: taxNumber || null,
            currency,
            creditLimit: Number(creditLimit),
            paymentTerms,
          },
        });
      } else {
        await createCustomerMutation.mutateAsync({
          customerCode,
          name,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          country: country || undefined,
          postalCode: postalCode || undefined,
          taxNumber: taxNumber || undefined,
          currency,
          creditLimit: Number(creditLimit),
          paymentTerms,
        });
      }
      setIsAddOpen(false);
      setEditingCustomer(null);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save customer");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "customerCode", header: "Customer Code" },
    { key: "name", header: "Customer Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "currency", header: "Currency" },
    { key: "creditLimit", header: "Credit Limit" },
    { key: "paymentTerms", header: "Terms" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = customersData?.find((c) => c.id === r["id"]);
        if (!item) return null;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedCustomer(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleOpenEdit(item)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteCustomerMutation.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = customersData
    ? customersData.map((c) => ({
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        email: c.email || "N/A",
        phone: c.phone || "N/A",
        currency: c.currency,
        creditLimit: `₹${Number(c.creditLimit).toLocaleString("en-IN")}`,
        paymentTerms: c.paymentTerms || "NET30",
        status: c.status === "ACTIVE" ? "Active" : c.status,
      }))
    : [];

  const stats = [
    { label: "Total Customers", value: isLoading ? "…" : String(customersData?.length || 0) },
    {
      label: "Active Accounts",
      value: isLoading
        ? "…"
        : String(customersData?.filter((c) => c.status === "ACTIVE").length || 0),
    },
    {
      label: "Default Terms",
      value: "NET30",
    },
  ];

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Sales & Accounts"
        actionLabel={canCreate ? "New customer" : ""}
        stats={stats}
        columns={columns}
        rows={rows}
        children={
          canCreate ? (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => {
                  setEditingCustomer(null);
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> New Customer
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Create / Edit Customer Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update customer details and billing terms."
                : "Register a new customer account for quotations and sales orders."}
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cCode">Customer Code *</Label>
              <Input
                id="cCode"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="e.g. CUST-001"
                disabled={Boolean(editingCustomer)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cName">Customer Name *</Label>
              <Input
                id="cName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
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
              <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
              <Input
                id="creditLimit"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="NET30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxNumber">Tax ID / GSTIN</Label>
              <Input
                id="taxNumber"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
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
              onClick={handleSave}
              disabled={
                createCustomerMutation.isPending ||
                updateCustomerMutation.isPending ||
                !customerCode ||
                !name
              }
            >
              {createCustomerMutation.isPending || updateCustomerMutation.isPending
                ? "Saving…"
                : "Save Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer View Dialog */}
      {selectedCustomer && (
        <Dialog open={Boolean(selectedCustomer)} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer.name} ({selectedCustomer.customerCode})
              </DialogTitle>
              <DialogDescription>
                Customer account details and billing parameters.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-2 text-sm border-y my-2">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{selectedCustomer.email || "N/A"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{selectedCustomer.phone || "N/A"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Credit Limit:</span>
                <span className="font-medium">
                  ₹{Number(selectedCustomer.creditLimit).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Payment Terms:</span>
                <span className="font-medium">{selectedCustomer.paymentTerms || "NET30"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Tax ID / GSTIN:</span>
                <span className="font-medium">{selectedCustomer.taxNumber || "N/A"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">
                  {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.country]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

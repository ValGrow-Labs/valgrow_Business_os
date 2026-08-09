import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useQuotations } from "@/hooks/queries/useQuotations";
import { useSalesOrders } from "@/hooks/queries/useSalesOrders";
import { useDeliveryNotes } from "@/hooks/queries/useDeliveryNotes";
import { useSalesInvoices } from "@/hooks/queries/useSalesInvoices";
import { useCustomerPayments } from "@/hooks/queries/useCustomerPayments";
import {
  ShoppingCart,
  Contact,
  ScrollText,
  ShoppingBag,
  PackageCheck,
  Receipt,
  CreditCard,
  Plus,
  ArrowRight,
} from "lucide-react";

const title = "Sales Dashboard";
const description =
  "Operational overview of customers, quotations, sales orders, deliveries, and receivables.";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SalesDashboardPage,
});

function SalesDashboardPage() {
  const { data: custData, isLoading: custLoading } = useCustomers();
  const { data: quoData, isLoading: quoLoading } = useQuotations();
  const { data: soData, isLoading: soLoading } = useSalesOrders();
  const { data: dnData, isLoading: dnLoading } = useDeliveryNotes();
  const { data: invData, isLoading: invLoading } = useSalesInvoices();
  const { data: payData } = useCustomerPayments();

  const openQuotes = quoData?.filter((q) => ["DRAFT", "SENT"].includes(q.status)) || [];
  const confirmedOrders =
    soData?.filter((s) => ["CONFIRMED", "PROCESSING", "PARTIALLY_DELIVERED"].includes(s.status)) ||
    [];
  const pendingDeliveries = dnData?.filter((d) => d.status === "DRAFT") || [];
  const unpaidInvoices =
    invData?.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED") || [];

  const totalReceivable = unpaidInvoices.reduce(
    (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
    0,
  );

  const stats = [
    {
      label: "Total Customers",
      value: custLoading ? "…" : String(custData?.length || 0),
      hint: `${custData?.filter((c) => c.status === "ACTIVE").length || 0} active accounts`,
    },
    {
      label: "Open Quotations",
      value: quoLoading ? "…" : String(openQuotes.length),
      hint: `${quoData?.filter((q) => q.status === "ACCEPTED").length || 0} accepted quotes`,
    },
    {
      label: "Active Sales Orders",
      value: soLoading ? "…" : String(confirmedOrders.length),
      hint: `${soData?.filter((s) => s.status === "DELIVERED").length || 0} fully delivered`,
    },
    {
      label: "Total Amount Due",
      value: invLoading ? "…" : `₹${totalReceivable.toLocaleString("en-IN")}`,
      hint: `${unpaidInvoices.length} outstanding invoices`,
    },
  ];

  return (
    <AppShell>
      <PageHeader title={title} description={description} eyebrow="Sales & Outbound Operations" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            hint={s.hint}
            tone={i === 0 ? "brand" : "default"}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Quick Actions */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Sales Operations Shortcuts</CardTitle>
            <CardDescription>
              Direct navigation and management of sales lifecycle documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/customers">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-2 p-4 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <Contact className="h-5 w-5 text-primary" />
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Customers</div>
                  <div className="text-xs text-muted-foreground">
                    {custData?.length || 0} accounts registered
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/quotations">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-2 p-4 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <ScrollText className="h-5 w-5 text-primary" />
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Quotations</div>
                  <div className="text-xs text-muted-foreground">
                    {quoData?.length || 0} total quotes
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/sales-orders">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-2 p-4 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Sales Orders</div>
                  <div className="text-xs text-muted-foreground">
                    {soData?.length || 0} total orders
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/delivery-notes">
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-2 p-4 text-left"
              >
                <div className="flex w-full items-center justify-between">
                  <PackageCheck className="h-5 w-5 text-primary" />
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Delivery Notes</div>
                  <div className="text-xs text-muted-foreground">
                    {dnData?.length || 0} delivery notes
                  </div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Sales Orders */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Sales Orders</CardTitle>
              <CardDescription>Latest customer orders across all statuses</CardDescription>
            </div>
            <Link to="/sales-orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {soData && soData.length > 0 ? (
              <div className="space-y-4">
                {soData.slice(0, 5).map((so) => (
                  <div
                    key={so.id}
                    className="flex items-center justify-between border-b pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium text-foreground">{so.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {so.customer?.name || "Customer N/A"} • {so.items.length} items
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        ₹{Number(so.totalAmount).toLocaleString("en-IN")}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {so.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No sales orders found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Receivables Summary</CardTitle>
            <CardDescription>Invoices & Customer Payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Total Invoiced</span>
              <span className="font-semibold">
                ₹
                {invData?.reduce((s, i) => s + Number(i.totalAmount), 0).toLocaleString("en-IN") ||
                  0}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Total Received</span>
              <span className="font-semibold text-success">
                ₹
                {invData?.reduce((s, i) => s + Number(i.paidAmount), 0).toLocaleString("en-IN") ||
                  0}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Outstanding Balance</span>
              <span className="font-semibold text-warning">
                ₹{totalReceivable.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="pt-2 flex gap-2">
              <Link to="/sales-invoices" className="flex-1">
                <Button variant="outline" className="w-full text-xs">
                  <Receipt className="mr-1 h-3.5 w-3.5" /> Invoices
                </Button>
              </Link>
              <Link to="/customer-payments" className="flex-1">
                <Button variant="outline" className="w-full text-xs">
                  <CreditCard className="mr-1 h-3.5 w-3.5" /> Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

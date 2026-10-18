import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePurchaseOrders } from "@/hooks/queries/usePurchaseOrders";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
import {
  Contact,
  ShoppingBag,
  PackageCheck,
  ArrowRight,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

const title = "Purchasing";
const description = "Manage suppliers, order products, and receive deliveries.";

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: PurchasingDashboardPage,
});

function PurchasingDashboardPage() {
  const { formatMoney } = useActiveCurrency();
  const { data: poData, isLoading: poLoading } = usePurchaseOrders();

  const actions = [
    {
      title: "Suppliers",
      description: "Manage the companies you buy from.",
      href: "/suppliers",
      icon: Contact,
    },
    {
      title: "Purchase Orders",
      description: "Create and track product orders.",
      href: "/purchase-orders",
      icon: ShoppingBag,
    },
    {
      title: "Receive Goods",
      description: "Record delivered products and update stock.",
      href: "/goods-receipts",
      icon: PackageCheck,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">How it works</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <h4 className="font-semibold text-sm mb-2 text-foreground">How Purchasing Works</h4>
              <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal pl-4">
                <li>
                  <strong className="text-foreground">Step 1: Choose Supplier</strong>
                  <p className="mt-0.5 text-muted-foreground">Select an existing supplier or add a new one.</p>
                </li>
                <li>
                  <strong className="text-foreground">Step 2: Order Products</strong>
                  <p className="mt-0.5 text-muted-foreground">Create a Purchase Order, select products and quantities, and submit or approve it as required.</p>
                </li>
                <li>
                  <strong className="text-foreground">Step 3: Receive Products</strong>
                  <p className="mt-0.5 text-muted-foreground">When products arrive, record the received quantities and post the receipt.</p>
                </li>
                <li>
                  <strong className="text-foreground">Step 4: Check Stock</strong>
                  <p className="mt-0.5 text-muted-foreground">Open Inventory and confirm the received stock has increased.</p>
                </li>
              </ol>
            </PopoverContent>
          </Popover>
        }
      />

      {/* Primary Action Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map((act) => (
          <Link key={act.title} to={act.href} className="group">
            <Card className="h-full transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <act.icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                    {act.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Purchase Orders */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Recent Purchase Orders</CardTitle>
            <CardDescription className="text-xs">
              Latest orders across all statuses
            </CardDescription>
          </div>
          <Link to="/purchase-orders">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {poLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading recent orders…
            </div>
          ) : poData && poData.length > 0 ? (
            <div className="divide-y divide-border/60">
              {poData.slice(0, 5).map((po) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{po.orderNumber}</span>
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {po.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {po.supplier?.name || "Supplier N/A"} • {po.items?.length || 0} items
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-foreground text-sm">
                        {formatMoney(po.totalAmount || 0, po.currency)}
                      </div>
                    </div>
                    <Link to="/purchase-orders">
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        View Order
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No purchase orders found.
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}


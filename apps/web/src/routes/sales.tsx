import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useSalesReport } from "@/hooks/queries/useReports";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { useBranches } from "@/hooks/queries/useBranches";
import { useQuotations } from "@/hooks/queries/useQuotations";
import { useSalesOrders } from "@/hooks/queries/useSalesOrders";
import { useDeliveryNotes } from "@/hooks/queries/useDeliveryNotes";
import { useSalesInvoices } from "@/hooks/queries/useSalesInvoices";
import { useCustomerPayments } from "@/hooks/queries/useCustomerPayments";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
import { SaleDetailDialog } from "@/components/sales/sale-detail-dialog";
import { downloadFile } from "@/lib/api-client";
import { toast } from "sonner";
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
  Eye,
  FileText,
  RotateCcw,
  Loader2,
  ListOrdered,
  LayoutDashboard,
} from "lucide-react";

const title = "Sales";
const description =
  "Complete record of retail POS sales and commercial invoices across all branches.";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { currencyCode, formatMoney } = useActiveCurrency();
  const [activeTab, setActiveTab] = useState<"transactions" | "overview">("transactions");

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SALES TRANSACTIONS (LISTPAGE FOUNDATION)
  // ─────────────────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerId, setCustomerId] = useState("ALL");
  const [branchId, setBranchId] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "POS_SALE" | "INVOICE">("ALL");

  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Master Data
  const { data: customers = [] } = useCustomers();
  const { data: branches = [] } = useBranches();

  const hasActiveFilters = Boolean(
    search.trim() ||
      dateFrom ||
      dateTo ||
      customerId !== "ALL" ||
      branchId !== "ALL" ||
      paymentMethod !== "ALL" ||
      typeFilter !== "ALL",
  );

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setCustomerId("ALL");
    setBranchId("ALL");
    setPaymentMethod("ALL");
    setTypeFilter("ALL");
  };

  const salesFilters = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      customerId: customerId !== "ALL" ? customerId : undefined,
      branchId: branchId !== "ALL" ? branchId : undefined,
      paymentMethod: paymentMethod !== "ALL" ? paymentMethod : undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [dateFrom, dateTo, customerId, branchId, paymentMethod, debouncedSearch],
  );

  const { data: salesReport, isLoading: isSalesLoading } = useSalesReport(salesFilters);

  const filteredRecords = useMemo(() => {
    const raw = salesReport?.records || [];
    if (typeFilter === "ALL") return raw;
    return raw.filter((r) => r.type === typeFilter);
  }, [salesReport, typeFilter]);

  const handleDownloadPdf = async (id: string, num: string, type: string) => {
    if (downloadingId) return;
    setDownloadingId(id);
    try {
      if (type === "INVOICE") {
        await downloadFile(`/sales-invoices/${id}/pdf`, `${num}.pdf`);
      } else {
        await downloadFile(`/pos/sales/${id}/receipt`, `${num}.pdf`);
      }
      toast.success(`${num} downloaded successfully`);
    } catch (err: any) {
      toast.error(err.message || `Failed to download ${num}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: Column<ListRow>[] = [
    {
      key: "number",
      header: "Receipt / Invoice #",
      render: (r) => {
        const item = filteredRecords.find((s) => s.id === r["id"]);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-primary">
              {String(r["number"])}
            </span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground uppercase">
              {item?.type === "INVOICE" ? "INV" : "POS"}
            </span>
          </div>
        );
      },
    },
    { key: "date", header: "Date & Time" },
    { key: "customer", header: "Customer" },
    { key: "branch", header: "Branch / Channel" },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (r) => (
        <Badge variant="neutral" className="text-[11px] font-normal">
          {String(r["paymentMethod"])}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "total",
      header: "Total Amount",
      render: (r) => (
        <span className="font-bold text-foreground tabular">
          {String(r["total"])}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const item = filteredRecords.find((s) => s.id === r["id"]);
        if (!item) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedSale(item)}
              title="View Sale Details"
              aria-label="View Sale Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              disabled={downloadingId === item.id}
              onClick={() => handleDownloadPdf(item.id, item.number, item.type)}
              title="Download PDF"
              aria-label="Download PDF"
            >
              {downloadingId === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = filteredRecords.map((r) => ({
    id: r.id,
    number: r.number,
    date: new Date(r.date).toLocaleString(currencyCode === "INR" ? "en-IN" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    customer: r.customerName || "Walk-in Retail Customer",
    branch: r.branchName || "Main Branch",
    paymentMethod: r.paymentMethods || "CASH",
    status: r.status,
    total: formatMoney(r.total, currencyCode),
  }));

  const stats = [
    {
      label: "Total Sales Revenue",
      value: isSalesLoading ? "…" : formatMoney(salesReport?.summary.totalSales || 0, currencyCode),
    },
    {
      label: "Total Transactions",
      value: isSalesLoading ? "…" : String(salesReport?.summary.orderCount || 0),
    },
    {
      label: "Tax Collected",
      value: isSalesLoading ? "…" : formatMoney(salesReport?.summary.totalTax || 0, currencyCode),
    },
    {
      label: "Discounts Given",
      value: isSalesLoading ? "…" : formatMoney(salesReport?.summary.totalDiscount || 0, currencyCode),
    },
  ];

  const filterContent = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date From */}
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <Label className="text-xs text-muted-foreground font-normal">From Date</Label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Date To */}
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <Label className="text-xs text-muted-foreground font-normal">To Date</Label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Customer Filter */}
      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <Label className="text-xs text-muted-foreground font-normal">Customer</Label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Branch Filter */}
      <div className="flex flex-col gap-1.5 min-w-[160px]">
        <Label className="text-xs text-muted-foreground font-normal">Branch</Label>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Payment Method Filter */}
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <Label className="text-xs text-muted-foreground font-normal">Payment Method</Label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Payment Methods</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="CREDIT_CARD">Credit Card</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </select>
      </div>

      {/* Type Filter */}
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <Label className="text-xs text-muted-foreground font-normal">Transaction Type</Label>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Sales Types</option>
          <option value="POS_SALE">Retail POS Sale</option>
          <option value="INVOICE">Direct Sales Invoice</option>
        </select>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 px-3 text-muted-foreground hover:text-foreground text-xs gap-1.5"
            title="Reset Filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. OPERATIONS OVERVIEW (PRESERVED OPERATIONS DASHBOARD)
  // ─────────────────────────────────────────────────────────────────────────────
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

  const overviewStats = [
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
      value: invLoading ? "…" : formatMoney(totalReceivable),
      hint: `${unpaidInvoices.length} outstanding invoices`,
    },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Navigation Switcher: Transactions List vs Overview */}
        <div className="flex items-center justify-between border-b pb-2">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-auto"
          >
            <TabsList className="bg-muted/60 p-1">
              <TabsTrigger
                value="transactions"
                className="gap-2 text-xs data-[state=active]:bg-background"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span>Sales Transactions</span>
                <Badge variant="neutral" className="ml-1 text-[10px] px-1.5 py-0">
                  {filteredRecords.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="gap-2 text-xs data-[state=active]:bg-background"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Operations Overview</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button asChild size="sm" className="gap-1.5 text-xs">
            <Link to="/pos">
              <Plus className="h-3.5 w-3.5" />
              <span>New POS Sale</span>
            </Link>
          </Button>
        </div>

        {activeTab === "transactions" ? (
          <ListPage
            title="Sales Transactions"
            description="Audit and inspect completed POS sales, retail counter receipts, and commercial invoices."
            stats={stats}
            columns={columns}
            rows={rows}
            isLoading={isSalesLoading}
            searchPlaceholder="Search by receipt #, invoice #, customer name..."
            searchValue={search}
            onSearchChange={setSearch}
            filterContent={filterContent}
          />
        ) : (
          <AppShell>
            <PageHeader
              title="Sales Operations"
              description="Operational overview of customers, quotations, sales orders, deliveries, and receivables."
              eyebrow="Sales Lifecycle &amp; Outbound Operations"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {overviewStats.map((s, i) => (
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
                              {formatMoney(so.totalAmount)}
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
                  <CardDescription>Invoices &amp; Customer Payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="text-muted-foreground">Total Invoiced</span>
                    <span className="font-semibold">
                      {formatMoney(invData?.reduce((s, i) => s + Number(i.totalAmount), 0) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="text-muted-foreground">Total Received</span>
                    <span className="font-semibold text-success">
                      {formatMoney(invData?.reduce((s, i) => s + Number(i.paidAmount), 0) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="text-muted-foreground">Outstanding Balance</span>
                    <span className="font-semibold text-warning">
                      {formatMoney(totalReceivable)}
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
        )}
      </div>

      {/* Sale Detail Inspection Modal */}
      <SaleDetailDialog
        open={Boolean(selectedSale)}
        onOpenChange={(open) => !open && setSelectedSale(null)}
        saleId={selectedSale?.id || null}
        saleType={selectedSale?.type}
        receiptNumber={selectedSale?.number}
      />
    </>
  );
}

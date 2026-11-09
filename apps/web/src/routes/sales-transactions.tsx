import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { StatusBadge } from "@/components/foundation/list-page";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/foundation/states";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { useBranches } from "@/hooks/queries/useBranches";
import {
  usePOSSales,
  usePOSSale,
  type POSSaleRecord,
} from "@/hooks/queries/usePOSCheckout";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
import { downloadFile } from "@/lib/api-client";
import { exportReportToCsv } from "@/hooks/queries/useReports";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { motion } from "motion/react";
import {
  ShoppingBag,
  Search,
  Download,
  Eye,
  FilterX,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  ArrowUpDown,
  Receipt,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/sales-transactions")({
  head: () => ({
    meta: [
      { title: "Sales Transactions · ValGrow Business OS" },
      {
        name: "description",
        content:
          "Complete audit log and ledger of all Point of Sale sales and store transactions.",
      },
    ],
  }),
  component: SalesTransactionsPage,
});

function computePaymentStatus(paid: number, total: number): "PAID" | "PARTIAL" | "UNPAID" {
  if (paid >= total && total > 0) return "PAID";
  if (paid > 0 && paid < total) return "PARTIAL";
  if (total === 0 && paid === 0) return "PAID";
  return "UNPAID";
}

function SalesTransactionsPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: branches = [] } = useBranches();
  const { currencyCode, formatMoney } = useActiveCurrency();

  const isOwner = currentUser?.role?.name?.toLowerCase() === "owner";
  const permissions = currentUser?.permissions || [];
  const canReadSales =
    isOwner || permissions.includes("pos.read") || permissions.includes("sales.read");

  // Query filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedTxStatus, setSelectedTxStatus] = useState("ALL");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("ALL");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">(
    "date-desc",
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog & Detail view
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch sales records
  const {
    data: salesRecords = [],
    isLoading,
    isError,
    refetch,
  } = usePOSSales();

  // Fetch detail for selected transaction
  const { data: saleDetail, isLoading: isDetailLoading } = usePOSSale(selectedSaleId || "");

  // Client-side filtering & sorting
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...salesRecords];

    // Search filter: receipt number, customer name, cashier name
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((s) => {
        const num = s.receiptNumber?.toLowerCase() || "";
        const cust = s.customer?.name?.toLowerCase() || "";
        const custCode = s.customer?.customerCode?.toLowerCase() || "";
        const cashierFirst = s.cashier?.firstName?.toLowerCase() || "";
        const cashierLast = s.cashier?.lastName?.toLowerCase() || "";
        const cashierFull = `${cashierFirst} ${cashierLast}`.trim();
        return (
          num.includes(q) ||
          cust.includes(q) ||
          custCode.includes(q) ||
          cashierFull.includes(q)
        );
      });
    }

    // Branch filter
    if (selectedBranch !== "ALL") {
      result = result.filter((s) => s.branchId === selectedBranch);
    }

    // Transaction Status filter
    if (selectedTxStatus !== "ALL") {
      result = result.filter((s) => s.status === selectedTxStatus);
    }

    // Payment Status filter
    if (selectedPaymentStatus !== "ALL") {
      result = result.filter((s) => {
        const pStatus = computePaymentStatus(Number(s.paidAmount), Number(s.totalAmount));
        return pStatus === selectedPaymentStatus;
      });
    }

    // Payment Method filter
    if (selectedPaymentMethod !== "ALL") {
      result = result.filter((s) =>
        s.payments?.some((p) => p.paymentMethod === selectedPaymentMethod),
      );
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter((s) => new Date(s.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((s) => new Date(s.createdAt) <= toDate);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "amount-desc") {
        return Number(b.totalAmount) - Number(a.totalAmount);
      }
      if (sortBy === "amount-asc") {
        return Number(a.totalAmount) - Number(b.totalAmount);
      }
      return 0;
    });

    return result;
  }, [
    salesRecords,
    searchTerm,
    selectedBranch,
    selectedTxStatus,
    selectedPaymentStatus,
    selectedPaymentMethod,
    dateFrom,
    dateTo,
    sortBy,
  ]);

  // Pagination calculation
  const totalRecords = filteredAndSortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedRecords = filteredAndSortedRecords.slice(startIndex, endIndex);

  // Summary Metrics based on filtered records
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalTax = 0;
    let totalPaid = 0;

    filteredAndSortedRecords.forEach((s) => {
      totalSales += Number(s.totalAmount) || 0;
      totalTax += Number(s.taxAmount) || 0;
      totalPaid += Number(s.paidAmount) || 0;
    });

    const avgValue = totalRecords > 0 ? totalSales / totalRecords : 0;

    return {
      totalSales,
      totalTax,
      totalPaid,
      avgValue,
      count: totalRecords,
    };
  }, [filteredAndSortedRecords, totalRecords]);

  // Handle PDF Receipt download
  const handleDownloadReceipt = async (sale: POSSaleRecord) => {
    setDownloadingId(sale.id);
    try {
      await downloadFile(`/pos/sales/${sale.id}/receipt`, `${sale.receiptNumber}.pdf`);
    } catch (err: any) {
      alert(err.message || "Failed to download receipt PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "Receipt Number",
      "Date & Time",
      "Customer",
      "Branch",
      "Cashier",
      "Payment Methods",
      "Subtotal",
      "Tax",
      "Discount",
      "Total Amount",
      "Paid Amount",
      "Payment Status",
      "Transaction Status",
    ];

    const rows = filteredAndSortedRecords.map((s) => [
      s.receiptNumber,
      new Date(s.createdAt).toISOString(),
      s.customer?.name || "Walk-in Retail Customer",
      s.branch?.name || "Main Branch",
      `${s.cashier?.firstName || ""} ${s.cashier?.lastName || ""}`.trim() || "System",
      s.payments?.map((p) => p.paymentMethod).join("; ") || "CASH",
      Number(s.subtotalAmount),
      Number(s.taxAmount),
      Number(s.discountAmount),
      Number(s.totalAmount),
      Number(s.paidAmount),
      computePaymentStatus(Number(s.paidAmount), Number(s.totalAmount)),
      s.status,
    ]);

    exportReportToCsv("sales_transactions", headers, rows);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedBranch("ALL");
    setSelectedTxStatus("ALL");
    setSelectedPaymentStatus("ALL");
    setSelectedPaymentMethod("ALL");
    setDateFrom("");
    setDateTo("");
    setSortBy("date-desc");
    setCurrentPage(1);
  };

  // If unauthorized, render Access Restricted view
  if (!canReadSales && currentUser) {
    return (
      <AppShell>
        <div className="flex min-h-[500px] flex-col items-center justify-center text-center p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Access Restricted</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            You do not have permission to review organization sales transactions. Please contact your
            workspace administrator.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/dashboard">Return to dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Sales Transactions"
        description="Comprehensive audit log of all Point of Sale sales and store checkout transactions."
        eyebrow="Sales & Outbound Operations"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={totalRecords === 0}>
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
            <Button asChild size="sm">
              <Link to="/pos">
                <ShoppingBag className="mr-1.5 h-4 w-4" />
                Open POS
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <motion.div
        variants={staggerContainer(0.04)}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <motion.div variants={staggerItem}>
          <StatCard
            label="Total Transactions"
            value={isLoading ? "…" : metrics.count.toLocaleString()}
            hint="Completed POS transactions"
            tone="brand"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Total Sales Value"
            value={isLoading ? "…" : formatMoney(metrics.totalSales)}
            hint="Gross transaction receipts"
            tone="default"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Total Tax Collected"
            value={isLoading ? "…" : formatMoney(metrics.totalTax)}
            hint="GST / statutory tax levied"
            tone="default"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Average Order Value"
            value={isLoading ? "…" : formatMoney(metrics.avgValue)}
            hint="Per completed sale"
            tone="default"
          />
        </motion.div>
      </motion.div>

      {/* Filters & Search Toolbar Panel */}
      <section className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search receipt #, customer, or cashier…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Quick Stats / Result count */}
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="tabular text-xs">
              Showing {totalRecords} {totalRecords === 1 ? "record" : "records"}
            </Badge>
            {(searchTerm ||
              selectedBranch !== "ALL" ||
              selectedTxStatus !== "ALL" ||
              selectedPaymentStatus !== "ALL" ||
              selectedPaymentMethod !== "ALL" ||
              dateFrom ||
              dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <FilterX className="h-3.5 w-3.5" />
                Reset filters
              </Button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Branch Filter */}
          <div className="w-40">
            <Select
              value={selectedBranch}
              onValueChange={(val) => {
                setSelectedBranch(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Filter */}
          <div className="w-40">
            <Select
              value={selectedPaymentStatus}
              onValueChange={(val) => {
                setSelectedPaymentStatus(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payment Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Status Filter */}
          <div className="w-36">
            <Select
              value={selectedTxStatus}
              onValueChange={(val) => {
                setSelectedTxStatus(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Filter */}
          <div className="w-40">
            <Select
              value={selectedPaymentMethod}
              onValueChange={(val) => {
                setSelectedPaymentMethod(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payment Methods</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range: From */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>From:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-36 text-xs"
            />
          </div>

          {/* Date Range: To */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>To:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-36 text-xs"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="ml-auto w-44">
            <Select
              value={sortBy}
              onValueChange={(val: any) => {
                setSortBy(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest first)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
                <SelectItem value="amount-desc">Total (Highest first)</SelectItem>
                <SelectItem value="amount-asc">Total (Lowest first)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Main Transactions Table Panel */}
      <section className="panel overflow-hidden">
        {isLoading && salesRecords.length === 0 ? (
          <div className="p-4">
            <LoadingSkeleton rows={6} />
          </div>
        ) : isError ? (
          <ErrorState
            className="m-6"
            title="Failed to load sales transactions"
            description="An error occurred while communicating with the POS service. Please try again."
            onRetry={() => refetch()}
          />
        ) : totalRecords === 0 ? (
          <EmptyState
            className="rounded-none border-0 py-12"
            icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
            title="No sales transactions found"
            description={
              searchTerm ||
              selectedBranch !== "ALL" ||
              selectedTxStatus !== "ALL" ||
              selectedPaymentStatus !== "ALL" ||
              dateFrom ||
              dateTo
                ? "No transactions match your active filter criteria."
                : "Completed sales from POS cash registers will appear here."
            }
            action={
              searchTerm ||
              selectedBranch !== "ALL" ||
              selectedTxStatus !== "ALL" ||
              selectedPaymentStatus !== "ALL" ||
              dateFrom ||
              dateTo ? (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/pos">Open POS</Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-surface-2/60">
                  <TableHead className="px-4 py-3 font-medium text-xs">Sale # / ID</TableHead>
                  <TableHead className="px-3 py-3 font-medium text-xs">Date & Time</TableHead>
                  <TableHead className="px-3 py-3 font-medium text-xs">Customer</TableHead>
                  <TableHead className="hidden px-3 py-3 font-medium text-xs md:table-cell">Branch</TableHead>
                  <TableHead className="hidden px-3 py-3 font-medium text-xs lg:table-cell">Cashier</TableHead>
                  <TableHead className="px-3 py-3 font-medium text-xs">Payment Method</TableHead>
                  <TableHead className="hidden px-3 py-3 text-right font-medium text-xs sm:table-cell">Subtotal</TableHead>
                  <TableHead className="hidden px-3 py-3 text-right font-medium text-xs sm:table-cell">Tax</TableHead>
                  <TableHead className="hidden px-3 py-3 text-right font-medium text-xs sm:table-cell">Discount</TableHead>
                  <TableHead className="px-3 py-3 text-right font-medium text-xs">Grand Total</TableHead>
                  <TableHead className="px-3 py-3 font-medium text-xs">Payment</TableHead>
                  <TableHead className="px-3 py-3 font-medium text-xs">Status</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((sale) => {
                  const pStatus = computePaymentStatus(
                    Number(sale.paidAmount),
                    Number(sale.totalAmount),
                  );
                  const cashierName =
                    `${sale.cashier?.firstName || ""} ${sale.cashier?.lastName || ""}`.trim() ||
                    "System";
                  const paymentMethodStr =
                    sale.payments && sale.payments.length > 0
                      ? sale.payments.map((p) => p.paymentMethod).join(", ")
                      : "CASH";

                  return (
                    <TableRow key={sale.id} className="border-b transition-colors hover:bg-surface-2/70">
                      {/* Sale Number */}
                      <TableCell className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                        {sale.receiptNumber}
                      </TableCell>

                      {/* Date and Time */}
                      <TableCell className="tabular px-3 py-3 text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleDateString(
                          currencyCode === "INR" ? "en-IN" : "en-US",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}{" "}
                        <span className="text-[11px] opacity-75">
                          {new Date(sale.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="max-w-[180px] px-3 py-3 text-xs">
                        <div className="truncate font-medium text-foreground">
                          {sale.customer?.name || "Walk-in Retail Customer"}
                        </div>
                        {sale.customer?.customerCode ? (
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {sale.customer.customerCode}
                          </div>
                        ) : null}
                      </TableCell>

                      {/* Branch */}
                      <TableCell className="hidden px-3 py-3 text-xs text-muted-foreground md:table-cell">
                        {sale.branch?.name || "Main Branch"}
                      </TableCell>

                      {/* Cashier */}
                      <TableCell className="hidden px-3 py-3 text-xs text-muted-foreground lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground">
                            {cashierName.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate">{cashierName}</span>
                        </div>
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell className="px-3 py-3 text-xs">
                        <Badge variant="neutral" className="text-[11px]">
                          {paymentMethodStr}
                        </Badge>
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell className="hidden tabular px-3 py-3 text-right text-xs text-muted-foreground sm:table-cell">
                        {formatMoney(Number(sale.subtotalAmount))}
                      </TableCell>

                      {/* Tax */}
                      <TableCell className="hidden tabular px-3 py-3 text-right text-xs text-muted-foreground sm:table-cell">
                        {formatMoney(Number(sale.taxAmount))}
                      </TableCell>

                      {/* Discount */}
                      <TableCell className="hidden tabular px-3 py-3 text-right text-xs sm:table-cell">
                        {Number(sale.discountAmount) > 0 ? (
                          <span className="text-destructive">
                            -{formatMoney(Number(sale.discountAmount))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Grand Total */}
                      <TableCell className="tabular px-3 py-3 text-right text-xs font-semibold text-foreground">
                        {formatMoney(Number(sale.totalAmount))}
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell className="px-3 py-3 text-xs">
                        <StatusBadge value={pStatus} />
                      </TableCell>

                      {/* Transaction Status */}
                      <TableCell className="px-3 py-3 text-xs">
                        <StatusBadge value={sale.status} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setSelectedSaleId(sale.id);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Download Receipt PDF"
                            disabled={downloadingId === sale.id}
                            onClick={() => handleDownloadReceipt(sale)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Controlled Pagination Footer */}
        {totalRecords > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="tabular ml-2">
                Showing {startIndex + 1}–{endIndex} of {totalRecords} transactions
              </span>
            </div>

            {totalPages > 1 ? (
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (activePage > 1) setCurrentPage(activePage - 1);
                      }}
                      className={activePage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // Only show first, last, and window around active page
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= activePage - 1 && pageNum <= activePage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={pageNum === activePage}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (pageNum === activePage - 2 || pageNum === activePage + 2) {
                      return (
                        <PaginationItem key={pageNum}>
                          <span className="px-2 text-muted-foreground">…</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (activePage < totalPages) setCurrentPage(activePage + 1);
                      }}
                      className={
                        activePage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5 text-primary" />
                  <span>Transaction {saleDetail?.receiptNumber || selectedSaleId}</span>
                </DialogTitle>
                <DialogDescription>
                  Full Point of Sale transaction audit trail and itemized breakdown.
                </DialogDescription>
              </div>
              {saleDetail ? (
                <div className="flex items-center gap-1.5">
                  <StatusBadge value={saleDetail.status} />
                  <StatusBadge
                    value={computePaymentStatus(
                      Number(saleDetail.paidAmount),
                      Number(saleDetail.totalAmount),
                    )}
                  />
                </div>
              ) : null}
            </div>
          </DialogHeader>

          {isDetailLoading || !saleDetail ? (
            <div className="py-8">
              <LoadingSkeleton rows={4} />
            </div>
          ) : (
            <div className="space-y-5 text-sm">
              {/* Meta information grid */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-surface-2/40 p-3 sm:grid-cols-4">
                <div>
                  <span className="block text-[11px] font-medium text-muted-foreground">Branch</span>
                  <span className="font-semibold text-foreground">
                    {saleDetail.branch?.name || "Main Branch"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-muted-foreground">Warehouse</span>
                  <span className="font-semibold text-foreground">
                    {saleDetail.warehouse?.name || "Default Warehouse"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-muted-foreground">Cashier</span>
                  <span className="font-semibold text-foreground">
                    {`${saleDetail.cashier?.firstName || ""} ${saleDetail.cashier?.lastName || ""}`.trim() ||
                      "System"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-muted-foreground">Date & Time</span>
                  <span className="tabular font-semibold text-foreground">
                    {new Date(saleDetail.createdAt).toLocaleString(
                      currencyCode === "INR" ? "en-IN" : "en-US",
                    )}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="rounded-lg border p-3">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Customer Details
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {saleDetail.customer?.name || "Walk-in Retail Customer"}
                    </p>
                    {saleDetail.customer?.customerCode ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        Code: {saleDetail.customer.customerCode}
                      </p>
                    ) : null}
                  </div>
                  {saleDetail.customer?.email || saleDetail.customer?.phone ? (
                    <div className="text-right text-xs text-muted-foreground">
                      {saleDetail.customer.email && <p>{saleDetail.customer.email}</p>}
                      {saleDetail.customer.phone && <p>{saleDetail.customer.phone}</p>}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Itemized Products Table */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Itemized Order Lines
                </span>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-2/60 text-muted-foreground border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Item & SKU</th>
                        <th className="px-3 py-2 text-right font-medium">Qty</th>
                        <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                        <th className="px-3 py-2 text-right font-medium">Tax</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {saleDetail.salesOrder?.items && saleDetail.salesOrder.items.length > 0 ? (
                        saleDetail.salesOrder.items.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">
                              <div className="font-medium text-foreground">
                                {item.product?.name || "Product Item"}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {item.product?.sku || item.productId}
                                {item.variant ? ` · ${item.variant.name}` : ""}
                              </div>
                            </td>
                            <td className="tabular px-3 py-2 text-right">
                              {Number(item.orderedQty || item.deliveredQty || 1)}
                            </td>
                            <td className="tabular px-3 py-2 text-right">
                              {formatMoney(Number(item.unitPrice || 0))}
                            </td>
                            <td className="tabular px-3 py-2 text-right text-muted-foreground">
                              {formatMoney(Number(item.taxAmount || 0))}
                            </td>
                            <td className="tabular px-3 py-2 text-right font-semibold text-foreground">
                              {formatMoney(Number(item.totalAmount || 0))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">
                            Single transaction invoice total: {formatMoney(Number(saleDetail.totalAmount))}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals Breakdown */}
              <div className="rounded-lg border bg-surface-2/20 p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal Amount:</span>
                  <span className="tabular font-medium text-foreground">
                    {formatMoney(Number(saleDetail.subtotalAmount))}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tax Amount:</span>
                  <span className="tabular font-medium text-foreground">
                    {formatMoney(Number(saleDetail.taxAmount))}
                  </span>
                </div>
                {Number(saleDetail.discountAmount) > 0 ? (
                  <div className="flex justify-between text-xs text-destructive">
                    <span>Discount:</span>
                    <span className="tabular font-medium">
                      -{formatMoney(Number(saleDetail.discountAmount))}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t pt-1.5 text-sm font-bold text-foreground">
                  <span>Grand Total:</span>
                  <span className="tabular">{formatMoney(Number(saleDetail.totalAmount))}</span>
                </div>
                <div className="flex justify-between text-xs text-success font-medium">
                  <span>Total Amount Paid:</span>
                  <span className="tabular">{formatMoney(Number(saleDetail.paidAmount))}</span>
                </div>
                {Number(saleDetail.changeAmount) > 0 ? (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Change Returned:</span>
                    <span className="tabular">{formatMoney(Number(saleDetail.changeAmount))}</span>
                  </div>
                ) : null}
              </div>

              {/* Payment Records breakdown */}
              {saleDetail.payments && saleDetail.payments.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Payments Recorded
                  </span>
                  <div className="divide-y rounded-lg border bg-surface-2/10">
                    {saleDetail.payments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{p.paymentMethod}</span>
                          {p.referenceNumber && (
                            <span className="font-mono text-muted-foreground">
                              Ref: {p.referenceNumber}
                            </span>
                          )}
                        </div>
                        <span className="tabular font-bold text-foreground">
                          {formatMoney(Number(p.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-row items-center justify-between gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!saleDetail || downloadingId === saleDetail?.id}
              onClick={() => saleDetail && handleDownloadReceipt(saleDetail)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {downloadingId === saleDetail?.id ? "Generating PDF…" : "Download Receipt PDF"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}


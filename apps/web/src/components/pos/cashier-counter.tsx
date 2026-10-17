import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  usePaymentQueue,
  useClaimPayment,
  useReturnToQueue,
  useCancelPOSTransaction,
  type POSQueueCartItem,
} from "@/hooks/queries/usePOSWorkflow";
import {
  usePOSCheckout,
  type CustomerPaymentMethod,
  type POSPaymentItemDto,
  type POSSaleResult,
} from "@/hooks/queries/usePOSCheckout";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import {
  usePOSSessions,
  useOpenPOSSession,
  type POSSessionItem,
} from "@/hooks/queries/usePOSSessions";
import { ApiError, downloadFile } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Clock,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertCircle,
  Printer,
  Plus,
  Trash2,
  Wallet,
  ArrowRight,
  CircleDollarSign,
} from "lucide-react";

interface CashierCounterProps {
  branchId?: string | undefined;
  warehouseId?: string | undefined;
  activeSession?: POSSessionItem | undefined;
}

export function CashierCounter({
  branchId,
  warehouseId,
  activeSession: propSession,
}: CashierCounterProps) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.user?.id;
  const isOwner = currentUser?.role?.name === "Owner";
  const permissions = currentUser?.permissions || [];
  const canCancel = isOwner || permissions.includes("pos.cancel");
  const canOpenSession = isOwner || permissions.includes("pos.session");

  // Fallback to active open session if not passed as prop
  const { data: openSessions } = usePOSSessions("OPEN");
  const activeSession = propSession || openSessions?.[0];

  // Open Shift State (if no session active)
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [openTerminalId, setOpenTerminalId] = useState("CASH-REG-01");
  const [openOpeningCash, setOpenOpeningCash] = useState("1000");
  const openSessionMutation = useOpenPOSSession();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "READY_FOR_PAYMENT" | "CLAIMED_BY_ME">("ALL");

  // Selected Bill State
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);

  // Payment Form State
  const [paymentLines, setPaymentLines] = useState<POSPaymentItemDto[]>([
    { paymentMethod: "CASH", amount: 0, receivedAmount: 0 },
  ]);
  const [cartDiscount, setCartDiscount] = useState<string>("0");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Post-Checkout Receipt State
  const [completedSale, setCompletedSale] = useState<POSSaleResult["sale"] | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Cancellation Dialog State
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Payment Queue Query (polls every 5s)
  const {
    data: queueResponse,
    isLoading: isQueueLoading,
    isRefetching,
    refetch: refetchQueue,
  } = usePaymentQueue({
    branchId: branchId || undefined,
    warehouseId: warehouseId || undefined,
  });

  const allItems = queueResponse?.items || [];

  // Filtered queue items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (statusFilter === "READY_FOR_PAYMENT" && item.workflowStatus !== "READY_FOR_PAYMENT") {
        return false;
      }
      if (statusFilter === "CLAIMED_BY_ME") {
        if (item.workflowStatus !== "PAYMENT_IN_PROGRESS" || item.cashierId !== currentUserId) {
          return false;
        }
      }

      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const ticketMatch = item.cartNumber?.toLowerCase().includes(query);
        const customerMatch = item.customer?.name?.toLowerCase().includes(query) ||
                              item.customer?.phone?.includes(query);
        return Boolean(ticketMatch || customerMatch);
      }

      return true;
    });
  }, [allItems, statusFilter, search, currentUserId]);

  // Selected bill
  const activeBill = useMemo(() => {
    return allItems.find((item) => item.id === selectedCartId) || null;
  }, [allItems, selectedCartId]);

  const isClaimedByMe =
    activeBill?.workflowStatus === "PAYMENT_IN_PROGRESS" && activeBill?.cashierId === currentUserId;

  // Sync payment amount when activeBill is selected
  const grandTotal = useMemo(() => {
    if (!activeBill) return 0;
    const baseTotal = Number(activeBill.totalAmount);
    const disc = parseFloat(cartDiscount) || 0;
    return Math.max(0, baseTotal - disc);
  }, [activeBill, cartDiscount]);

  // Mutations
  const claimMutation = useClaimPayment();
  const returnToQueueMutation = useReturnToQueue();
  const cancelMutation = useCancelPOSTransaction();
  const checkoutMutation = usePOSCheckout();

  // Handle Claim
  const handleClaim = async (bill: POSQueueCartItem) => {
    if (!activeSession) {
      setShowOpenShiftModal(true);
      return;
    }

    try {
      await claimMutation.mutateAsync(bill.id);
      setSelectedCartId(bill.id);
      // Auto-initialize payment lines to full amount in cash
      const amt = Number(bill.totalAmount);
      setPaymentLines([{ paymentMethod: "CASH", amount: amt, receivedAmount: amt }]);
      setCartDiscount("0");
      setPaymentNotes("");
      toast.success("Bill claimed for checkout", {
        description: `Ticket ${bill.cartNumber || bill.id} is now assigned to this register.`,
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Bill already claimed", {
          description: "Another cashier has just claimed this bill.",
        });
      } else {
        toast.error("Failed to claim bill", {
          description: err.message || "An unexpected error occurred.",
        });
      }
      refetchQueue();
    }
  };

  // Payment Lines calculations
  const totalPaid = paymentLines.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const cashLine = paymentLines.find((p) => p.paymentMethod === "CASH");
  const totalCashReceived = cashLine?.receivedAmount || cashLine?.amount || 0;
  const cashChangeAmount = Math.max(0, (cashLine ? Number(cashLine.receivedAmount || cashLine.amount) - Number(cashLine.amount) : 0));
  const remainingDue = Math.max(0, grandTotal - totalPaid);

  // Add split payment method
  const handleAddPaymentMethod = () => {
    if (remainingDue <= 0) {
      toast.info("Total bill already covered");
      return;
    }
    setPaymentLines([
      ...paymentLines,
      { paymentMethod: "UPI", amount: remainingDue, receivedAmount: remainingDue },
    ]);
  };

  // Remove payment line
  const handleRemovePaymentMethod = (index: number) => {
    if (paymentLines.length <= 1) return;
    setPaymentLines(paymentLines.filter((_, i) => i !== index));
  };

  // Update payment line
  const handleUpdatePaymentLine = (
    index: number,
    field: keyof POSPaymentItemDto,
    value: any,
  ) => {
    setPaymentLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated: POSPaymentItemDto = { ...line, [field]: value };
        if (field === "paymentMethod" && value !== "CASH") {
          updated.receivedAmount = updated.amount;
        }
        return updated;
      }),
    );
  };

  // Execute Checkout
  const handleExecuteCheckout = async () => {
    if (!activeBill) return;
    if (!activeSession) {
      setShowOpenShiftModal(true);
      return;
    }

    if (totalPaid < grandTotal) {
      toast.error("Insufficient payment", {
        description: `Remaining balance: ₹${remainingDue.toFixed(2)}. Please collect the full bill amount.`,
      });
      return;
    }

    try {
      const result = await checkoutMutation.mutateAsync({
        sessionId: activeSession.id,
        cartId: activeBill.id,
        customerId: activeBill.customerId || undefined,
        payments: paymentLines.map((p) => ({
          paymentMethod: p.paymentMethod,
          amount: Number(p.amount),
          receivedAmount: p.receivedAmount ? Number(p.receivedAmount) : undefined,
          referenceNumber: p.referenceNumber || undefined,
        })),
        cartDiscountAmount: parseFloat(cartDiscount) || 0,
        notes: paymentNotes || undefined,
      });

      setCompletedSale(result.sale);
      setShowReceiptModal(true);
      setSelectedCartId(null);
      toast.success("Payment completed & receipt generated!", {
        description: `Receipt #${result.sale.receiptNumber} recorded.`,
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Payment conflict", {
          description: "This bill was already checked out or completed by another transaction.",
        });
        refetchQueue();
        setSelectedCartId(null);
      } else {
        toast.error("Checkout failed", {
          description: err.message || "An unexpected error occurred during payment processing.",
        });
      }
    }
  };

  // Return to queue
  const handleReturnToQueue = async () => {
    if (!activeBill) return;
    try {
      await returnToQueueMutation.mutateAsync({
        cartId: activeBill.id,
        notes: "Released by cashier",
      });
      setSelectedCartId(null);
      toast.info("Bill returned to cashier queue");
    } catch (err: any) {
      toast.error("Failed to release bill", { description: err.message });
    }
  };

  // Cancel bill
  const handleCancelBill = async () => {
    if (!activeBill || !cancelReason.trim()) return;
    try {
      await cancelMutation.mutateAsync({
        cartId: activeBill.id,
        reason: cancelReason.trim(),
      });
      setShowCancelDialog(false);
      setCancelReason("");
      setSelectedCartId(null);
      toast.warning("Bill cancelled");
    } catch (err: any) {
      toast.error("Failed to cancel bill", { description: err.message });
    }
  };

  // Download PDF receipt
  const handleDownloadReceipt = async (saleId: string, receiptNum?: string) => {
    try {
      await downloadFile(
        `/pos/sales/${saleId}/receipt`,
        `${receiptNum || "POS-Receipt"}.pdf`,
      );
    } catch (err: any) {
      toast.error("Failed to download PDF receipt", { description: err.message });
    }
  };

  // Format relative elapsed time
  const formatElapsed = (dateStr: string) => {
    const elapsedMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(elapsedMs / 60000);
    if (mins < 1) return "Just now";
    if (mins === 1) return "1 min ago";
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* REGISTER SHIFT STATUS BANNER */}
      {!activeSession && (
        <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <span className="font-bold">No Register Session Open:</span>
              <span className="ml-1 opacity-90">
                You must open a register shift to collect customer payments and reconcile your cash drawer.
              </span>
            </div>
          </div>
          {canOpenSession && (
            <Button
              size="sm"
              className="h-8 bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={() => setShowOpenShiftModal(true)}
            >
              Open Register Shift
            </Button>
          )}
        </div>
      )}

      {/* TOP CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Cashier Counter</h2>
              {isRefetching && (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Collect payments for verified tickets, manage cash change, and issue tax receipts.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === "ALL"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Bills ({allItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("READY_FOR_PAYMENT")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === "READY_FOR_PAYMENT"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ready to Pay (
              {
                allItems.filter((i) => i.workflowStatus === "READY_FOR_PAYMENT")
                  .length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CLAIMED_BY_ME")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === "CLAIMED_BY_ME"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Claimed (
              {
                allItems.filter(
                  (i) =>
                    i.workflowStatus === "PAYMENT_IN_PROGRESS" &&
                    i.cashierId === currentUserId,
                ).length
              }
              )
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchQueue()}
            disabled={isQueueLoading}
            className="h-8 gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isQueueLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* TWO-COLUMN CASHIER SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* LEFT COLUMN: PAYMENT QUEUE (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 border-b bg-muted/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket #, customer name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs bg-background"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isQueueLoading && allItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs">Loading payment queue...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    No bills waiting for payment
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {search
                      ? "No bills match your search criteria."
                      : "Verified bills forwarded from the Billing Desk will appear here."}
                  </p>
                </div>
              </div>
            ) : (
              filteredItems.map((bill) => {
                const isSelected = selectedCartId === bill.id;
                const isReady = bill.workflowStatus === "READY_FOR_PAYMENT";
                const isClaimedByCurrentUser =
                  bill.workflowStatus === "PAYMENT_IN_PROGRESS" &&
                  bill.cashierId === currentUserId;

                return (
                  <div
                    key={bill.id}
                    onClick={() => {
                      setSelectedCartId(bill.id);
                      const amt = Number(bill.totalAmount);
                      setPaymentLines([
                        { paymentMethod: "CASH", amount: amt, receivedAmount: amt },
                      ]);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-600"
                        : "bg-background hover:bg-muted/40 border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs font-bold tracking-tight bg-primary/10 text-primary border-primary/20"
                        >
                          {bill.cartNumber || "TICKET"}
                        </Badge>
                        {isReady && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] animate-pulse"
                          >
                            Ready for Payment
                          </Badge>
                        )}
                        {bill.workflowStatus === "PAYMENT_IN_PROGRESS" && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isClaimedByCurrentUser
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            }`}
                          >
                            {isClaimedByCurrentUser
                              ? "Claimed by You"
                              : `With ${bill.cashier?.firstName || "Cashier"}`}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatElapsed(bill.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs grid grid-cols-2 gap-1 text-muted-foreground">
                      <div className="truncate">
                        <span className="font-medium text-foreground">
                          {bill.customer?.name || "Walk-in Customer"}
                        </span>
                        {bill.customer?.phone && (
                          <span className="block text-[11px] opacity-80">
                            {bill.customer.phone}
                          </span>
                        )}
                      </div>
                      <div className="text-right truncate">
                        <span className="text-[11px]">Billed by: </span>
                        <span className="font-medium text-foreground">
                          {bill.billingStaff
                            ? `${bill.billingStaff.firstName} ${bill.billingStaff.lastName}`
                            : "Billing Desk"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {bill.items.length}{" "}
                        {bill.items.length === 1 ? "item" : "items"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground font-mono">
                          ₹
                          {Number(bill.totalAmount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>

                        {isReady ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaim(bill);
                            }}
                            disabled={claimMutation.isPending}
                          >
                            Claim & Pay
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCartId(bill.id);
                            }}
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHECKOUT & PAYMENT TERMINAL (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col bg-card border rounded-xl overflow-hidden shadow-xs">
          {!activeBill ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40">
                <CreditCard className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  No bill claimed
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Select a bill from the payment queue or click &quot;Claim &amp; Pay&quot; to begin checkout and cash collection.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Cashier Workbench Header */}
              <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-mono font-bold text-sm">
                    {activeBill.cartNumber?.slice(-4) || "PAY"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight">
                        Ticket {activeBill.cartNumber}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs"
                      >
                        {activeBill.workflowStatus === "READY_FOR_PAYMENT"
                          ? "Pending Claim"
                          : "Ready to Pay"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Customer:{" "}
                      <span className="font-medium text-foreground">
                        {activeBill.customer?.name || "Walk-in Retail Customer"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isClaimedByMe ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReturnToQueue}
                        disabled={returnToQueueMutation.isPending}
                        className="text-xs h-8 gap-1"
                        title="Release this bill back to the cashier queue"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Release
                      </Button>
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCancelDialog(true)}
                          className="text-xs h-8 text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() => handleClaim(activeBill)}
                      disabled={claimMutation.isPending}
                    >
                      Claim This Bill
                    </Button>
                  )}
                </div>
              </div>

              {/* Items Summary & Payment Collector (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Bill Amount Due Hero */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Total Amount Due
                    </span>
                    <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                      ₹
                      {grandTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div className="text-right text-xs space-y-0.5 text-muted-foreground">
                    <div>
                      Subtotal:{" "}
                      <span className="font-mono text-foreground">
                        ₹{Number(activeBill.subtotalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      Tax:{" "}
                      <span className="font-mono text-foreground">
                        ₹{Number(activeBill.taxAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Payment Methods &amp; Split Tender
                    </Label>
                    {isClaimedByMe && remainingDue > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddPaymentMethod}
                        className="h-7 text-xs gap-1 text-primary"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Split Payment
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {paymentLines.map((line, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted/20 border rounded-xl space-y-2 text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          {/* Method Select */}
                          <div className="sm:col-span-4">
                            <select
                              value={line.paymentMethod}
                              disabled={!isClaimedByMe}
                              onChange={(e) =>
                                handleUpdatePaymentLine(
                                  idx,
                                  "paymentMethod",
                                  e.target.value as CustomerPaymentMethod,
                                )
                              }
                              className="w-full h-8 text-xs bg-background border rounded-md px-2 focus:ring-1 focus:ring-primary outline-hidden"
                            >
                              <option value="CASH">Cash (Cash Drawer)</option>
                              <option value="UPI">UPI / QR Code</option>
                              <option value="CREDIT_CARD">Credit Card</option>
                              <option value="DEBIT_CARD">Debit Card</option>
                              <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                          </div>

                          {/* Tender Amount */}
                          <div className="sm:col-span-3">
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-muted-foreground font-mono">
                                ₹
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Amount"
                                disabled={!isClaimedByMe}
                                value={line.amount || ""}
                                onChange={(e) =>
                                  handleUpdatePaymentLine(
                                    idx,
                                    "amount",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="pl-6 h-8 text-xs font-mono font-bold"
                              />
                            </div>
                          </div>

                          {/* Reference or Cash Received */}
                          <div className="sm:col-span-4">
                            {line.paymentMethod === "CASH" ? (
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-muted-foreground font-mono">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Cash Received"
                                  disabled={!isClaimedByMe}
                                  value={line.receivedAmount || ""}
                                  onChange={(e) =>
                                    handleUpdatePaymentLine(
                                      idx,
                                      "receivedAmount",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="pl-6 h-8 text-xs font-mono"
                                />
                              </div>
                            ) : (
                              <Input
                                placeholder="Ref / Auth / UTR #"
                                disabled={!isClaimedByMe}
                                value={line.referenceNumber || ""}
                                onChange={(e) =>
                                  handleUpdatePaymentLine(
                                    idx,
                                    "referenceNumber",
                                    e.target.value,
                                  )
                                }
                                className="h-8 text-xs"
                              />
                            )}
                          </div>

                          {/* Delete Line */}
                          {paymentLines.length > 1 && isClaimedByMe && (
                            <div className="sm:col-span-1 text-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemovePaymentMethod(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Cash Change Indicator if this is Cash */}
                        {line.paymentMethod === "CASH" && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t text-muted-foreground">
                            <span>Change to Return to Customer:</span>
                            <span
                              className={`font-mono font-bold text-sm ${
                                cashChangeAmount > 0
                                  ? "text-emerald-600"
                                  : "text-foreground"
                              }`}
                            >
                              ₹{cashChangeAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Discount & Notes */}
                {isClaimedByMe && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div>
                      <Label htmlFor="cashier-notes" className="text-xs">
                        Cashier Notes
                      </Label>
                      <Input
                        id="cashier-notes"
                        placeholder="Optional remarks..."
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cart-discount" className="text-xs">
                        Additional Bill Discount (₹)
                      </Label>
                      <Input
                        id="cart-discount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={cartDiscount}
                        onChange={(e) => setCartDiscount(e.target.value)}
                        className="h-8 text-xs mt-1 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Payment Submission Footer */}
              <div className="p-4 border-t bg-muted/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total Amount Tendered:</span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹{totalPaid.toFixed(2)} / ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

                {remainingDue > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-600 bg-amber-500/10 p-2 rounded-lg">
                    <span>Remaining Balance Due:</span>
                    <span className="font-mono">₹{remainingDue.toFixed(2)}</span>
                  </div>
                )}

                {isClaimedByMe ? (
                  <Button
                    size="lg"
                    className="w-full gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleExecuteCheckout}
                    disabled={
                      checkoutMutation.isPending ||
                      totalPaid < grandTotal ||
                      !activeSession
                    }
                  >
                    <Wallet className="h-5 w-5" />
                    {checkoutMutation.isPending
                      ? "Recording Payment..."
                      : `Complete Payment (₹${grandTotal.toFixed(2)})`}
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={() => handleClaim(activeBill)}
                    disabled={claimMutation.isPending}
                  >
                    <CreditCard className="h-5 w-5" />
                    Claim Bill for Checkout
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OPEN SHIFT MODAL */}
      <Dialog open={showOpenShiftModal} onOpenChange={setShowOpenShiftModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              Open Cashier Register Shift
            </DialogTitle>
            <DialogDescription>
              Initialize your cash drawer session to start receiving payments and recording transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="terminal-id">Register Terminal ID</Label>
              <Input
                id="terminal-id"
                value={openTerminalId}
                onChange={(e) => setOpenTerminalId(e.target.value)}
                placeholder="REG-01"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="opening-cash">Opening Cash Drawer Float (₹)</Label>
              <Input
                id="opening-cash"
                type="number"
                min="0"
                value={openOpeningCash}
                onChange={(e) => setOpenOpeningCash(e.target.value)}
                placeholder="1000"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOpenShiftModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                if (!branchId || !warehouseId) {
                  toast.error("Branch and Warehouse configuration missing.");
                  return;
                }
                try {
                  await openSessionMutation.mutateAsync({
                    branchId,
                    warehouseId,
                    terminalId: openTerminalId.trim() || "REG-01",
                    openingCash: parseFloat(openOpeningCash) || 0,
                  });
                  setShowOpenShiftModal(false);
                  toast.success("Cashier register shift opened!");
                } catch (err: any) {
                  toast.error("Failed to open shift", { description: err.message });
                }
              }}
              disabled={openSessionMutation.isPending}
            >
              {openSessionMutation.isPending ? "Opening..." : "Confirm & Start Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POST-CHECKOUT SUCCESS RECEIPT MODAL */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-4 space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <DialogTitle className="text-lg font-bold">
                Payment Received &amp; Sale Complete!
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Receipt Number:{" "}
                <span className="font-mono font-bold text-foreground">
                  {completedSale?.receiptNumber}
                </span>
              </p>
            </div>

            <div className="w-full bg-muted/40 p-4 rounded-xl space-y-2 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bill:</span>
                <span className="font-mono font-bold">
                  ₹{Number(completedSale?.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ₹{Number(completedSale?.paidAmount).toFixed(2)}
                </span>
              </div>
              {Number(completedSale?.changeAmount) > 0 && (
                <div className="flex justify-between pt-1 border-t text-sm font-bold text-emerald-600">
                  <span>Change Given:</span>
                  <span className="font-mono">
                    ₹{Number(completedSale?.changeAmount).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => {
                  if (completedSale) {
                    handleDownloadReceipt(
                      completedSale.id,
                      completedSale.receiptNumber,
                    );
                  }
                }}
              >
                <Printer className="h-4 w-4" />
                Print / PDF Receipt
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowReceiptModal(false);
                  setCompletedSale(null);
                }}
              >
                Next Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CANCELLATION DIALOG */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancel Transaction
            </DialogTitle>
            <DialogDescription>
              Provide a mandatory reason for cancelling ticket {activeBill?.cartNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="cashier-cancel-reason" className="text-xs font-semibold">
              Cancellation Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cashier-cancel-reason"
              placeholder="e.g. Card declined, customer walked out..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="text-xs resize-none h-20"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(false)}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              onClick={handleCancelBill}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

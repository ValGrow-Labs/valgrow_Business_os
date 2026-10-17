import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useBillingQueue,
  useClaimBilling,
  useSendToPayment,
  useReturnToQueue,
  useCancelPOSTransaction,
  type POSQueueCartItem,
} from "@/hooks/queries/usePOSWorkflow";
import {
  useUpdatePOSCartItem,
  useRemovePOSCartItem,
} from "@/hooks/queries/usePOSCarts";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { ApiError } from "@/lib/api-client";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  Clock,
  User,
  ShoppingBag,
  Send,
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Receipt,
  ArrowRight,
} from "lucide-react";

interface BillingDeskProps {
  branchId?: string | undefined;
  warehouseId?: string | undefined;
}

export function BillingDesk({ branchId, warehouseId }: BillingDeskProps) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.user?.id;
  const isOwner = currentUser?.role?.name === "Owner";
  const permissions = currentUser?.permissions || [];
  const canCancel = isOwner || permissions.includes("pos.cancel");

  // Filter & Search State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SENT_TO_BILLING" | "CLAIMED_BY_ME">("ALL");

  // Selected Ticket State
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);

  // Dialog States
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardNotes, setForwardNotes] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Query: Billing Queue (polls every 5s)
  const {
    data: queueResponse,
    isLoading: isQueueLoading,
    isRefetching,
    refetch: refetchQueue,
  } = useBillingQueue({
    branchId: branchId || undefined,
    warehouseId: warehouseId || undefined,
  });

  const allItems = queueResponse?.items || [];

  // Filtered queue items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Status filter
      if (statusFilter === "SENT_TO_BILLING" && item.workflowStatus !== "SENT_TO_BILLING") {
        return false;
      }
      if (statusFilter === "CLAIMED_BY_ME") {
        if (item.workflowStatus !== "BILLING_IN_PROGRESS" || item.billingStaffId !== currentUserId) {
          return false;
        }
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const ticketMatch = item.cartNumber?.toLowerCase().includes(query);
        const customerMatch = item.customer?.name?.toLowerCase().includes(query) ||
                              item.customer?.phone?.includes(query);
        const notesMatch = item.notes?.toLowerCase().includes(query);
        return Boolean(ticketMatch || customerMatch || notesMatch);
      }

      return true;
    });
  }, [allItems, statusFilter, search, currentUserId]);

  // Active selected cart
  const activeTicket = useMemo(() => {
    return allItems.find((item) => item.id === selectedCartId) || null;
  }, [allItems, selectedCartId]);

  const isClaimedByMe = activeTicket?.workflowStatus === "BILLING_IN_PROGRESS" && activeTicket?.billingStaffId === currentUserId;

  // Mutations
  const claimMutation = useClaimBilling();
  const sendToPaymentMutation = useSendToPayment();
  const returnToQueueMutation = useReturnToQueue();
  const cancelMutation = useCancelPOSTransaction();
  const updateItemMutation = useUpdatePOSCartItem();
  const removeItemMutation = useRemovePOSCartItem();

  // Handle Claim
  const handleClaim = async (ticket: POSQueueCartItem) => {
    try {
      await claimMutation.mutateAsync(ticket.id);
      setSelectedCartId(ticket.id);
      toast.success("Ticket claimed for billing", {
        description: `Ticket ${ticket.cartNumber || ticket.id} is now assigned to you.`,
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Ticket already claimed", {
          description: "Another billing employee has just claimed this ticket.",
        });
      } else {
        toast.error("Failed to claim ticket", {
          description: err.message || "An unexpected error occurred.",
        });
      }
      refetchQueue();
    }
  };

  // Handle Forward to Cashier
  const handleSendToPayment = async () => {
    if (!activeTicket) return;
    try {
      await sendToPaymentMutation.mutateAsync({
        cartId: activeTicket.id,
        notes: forwardNotes || undefined,
      });
      setShowForwardDialog(false);
      setForwardNotes("");
      setSelectedCartId(null);
      toast.success("Bill sent to Cashier counter", {
        description: `Ticket ${activeTicket.cartNumber || activeTicket.id} is ready for payment collection.`,
      });
    } catch (err: any) {
      toast.error("Failed to forward bill", {
        description: err.message || "Please check cart lines and retry.",
      });
    }
  };

  // Handle Return to Queue
  const handleReturnToQueue = async () => {
    if (!activeTicket) return;
    try {
      await returnToQueueMutation.mutateAsync({
        cartId: activeTicket.id,
        notes: "Returned to queue by billing desk",
      });
      setSelectedCartId(null);
      toast.info("Ticket returned to queue", {
        description: `Ticket ${activeTicket.cartNumber} is now available for other billing clerks.`,
      });
    } catch (err: any) {
      toast.error("Failed to return ticket", {
        description: err.message || "An unexpected error occurred.",
      });
    }
  };

  // Handle Cancel Ticket
  const handleCancelTicket = async () => {
    if (!activeTicket || !cancelReason.trim()) return;
    try {
      await cancelMutation.mutateAsync({
        cartId: activeTicket.id,
        reason: cancelReason.trim(),
      });
      setShowCancelDialog(false);
      setCancelReason("");
      setSelectedCartId(null);
      toast.warning("Ticket cancelled", {
        description: `Ticket ${activeTicket.cartNumber} has been marked as CANCELLED.`,
      });
    } catch (err: any) {
      toast.error("Failed to cancel ticket", {
        description: err.message || "An unexpected error occurred.",
      });
    }
  };

  // Adjust line item quantity (if claimed by me)
  const handleQuantityChange = async (itemId: string, currentQty: number, delta: number) => {
    if (!activeTicket || !isClaimedByMe) return;
    const newQty = Math.max(0.001, currentQty + delta);
    try {
      await updateItemMutation.mutateAsync({
        cartId: activeTicket.id,
        itemId,
        dto: { quantity: newQty },
      });
      refetchQueue();
    } catch (err: any) {
      toast.error("Failed to update item quantity", {
        description: err.message || "Check stock levels and try again.",
      });
    }
  };

  // Remove line item
  const handleRemoveItem = async (itemId: string) => {
    if (!activeTicket || !isClaimedByMe) return;
    try {
      await removeItemMutation.mutateAsync({
        cartId: activeTicket.id,
        itemId,
      });
      refetchQueue();
      toast.info("Item removed from ticket");
    } catch (err: any) {
      toast.error("Failed to remove item", {
        description: err.message || "An unexpected error occurred.",
      });
    }
  };

  // Format elapsed time
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
      {/* TOP STATS & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Billing Queue</h2>
              {isRefetching && (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Review and verify customer tickets drafted on the sales floor.
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
              All ({allItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("SENT_TO_BILLING")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === "SENT_TO_BILLING"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending Claim (
              {allItems.filter((i) => i.workflowStatus === "SENT_TO_BILLING").length}
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
                    i.workflowStatus === "BILLING_IN_PROGRESS" &&
                    i.billingStaffId === currentUserId,
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
            <RefreshCw className={`h-3.5 w-3.5 ${isQueueLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* LEFT COLUMN: TICKET QUEUE LIST (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col bg-card border rounded-xl overflow-hidden shadow-xs">
          {/* Queue Search */}
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

          {/* Queue List Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isQueueLoading && allItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs">Loading billing queue...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    No tickets in queue
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {search
                      ? "No tickets match your search criteria."
                      : "When salespeople send carts from the floor, they appear here."}
                  </p>
                </div>
              </div>
            ) : (
              filteredItems.map((ticket) => {
                const isSelected = selectedCartId === ticket.id;
                const isPendingClaim = ticket.workflowStatus === "SENT_TO_BILLING";
                const isClaimedByCurrentUser =
                  ticket.workflowStatus === "BILLING_IN_PROGRESS" &&
                  ticket.billingStaffId === currentUserId;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedCartId(ticket.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                        : "bg-background hover:bg-muted/40 border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs font-bold tracking-tight bg-primary/10 text-primary border-primary/20"
                        >
                          {ticket.cartNumber || "DRAFT"}
                        </Badge>
                        {isPendingClaim && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] animate-pulse"
                          >
                            Waiting for Claim
                          </Badge>
                        )}
                        {ticket.workflowStatus === "BILLING_IN_PROGRESS" && (
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
                              : `With ${ticket.billingStaff?.firstName || "Staff"}`}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatElapsed(ticket.createdAt)}</span>
                      </div>
                    </div>

                    {/* Customer & Salesperson details */}
                    <div className="mt-2 text-xs grid grid-cols-2 gap-1 text-muted-foreground">
                      <div className="truncate">
                        <span className="font-medium text-foreground">
                          {ticket.customer?.name || "Walk-in Customer"}
                        </span>
                        {ticket.customer?.phone && (
                          <span className="block text-[11px] opacity-80">
                            {ticket.customer.phone}
                          </span>
                        )}
                      </div>
                      <div className="text-right truncate">
                        <span className="text-[11px]">Sales: </span>
                        <span className="font-medium text-foreground">
                          {ticket.salesperson
                            ? `${ticket.salesperson.firstName} ${ticket.salesperson.lastName}`
                            : "Floor Staff"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Line: Items count & Total Amount */}
                    <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {ticket.items.length} {ticket.items.length === 1 ? "item" : "items"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          ₹{Number(ticket.totalAmount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>

                        {isPendingClaim ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaim(ticket);
                            }}
                            disabled={claimMutation.isPending}
                          >
                            Claim
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCartId(ticket.id);
                            }}
                          >
                            Review
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

        {/* RIGHT COLUMN: WORKBENCH / VERIFICATION PANEL (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col bg-card border rounded-xl overflow-hidden shadow-xs">
          {!activeTicket ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40">
                <Receipt className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  No ticket selected
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Select a pending ticket from the queue on the left or click &quot;Claim&quot; to begin verifying items for checkout.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Ticket Workbench Header */}
              <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono font-bold text-sm">
                    {activeTicket.cartNumber?.slice(-4) || "POS"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight">
                        Ticket {activeTicket.cartNumber}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={
                          activeTicket.workflowStatus === "SENT_TO_BILLING"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs"
                        }
                      >
                        {activeTicket.workflowStatus === "SENT_TO_BILLING"
                          ? "Pending Claim"
                          : "In Verification"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Customer:{" "}
                      <span className="font-medium text-foreground">
                        {activeTicket.customer?.name || "Walk-in Retail Customer"}
                      </span>
                      {activeTicket.customer?.phone && ` (${activeTicket.customer.phone})`}
                    </p>
                  </div>
                </div>

                {/* Workbench Top Actions */}
                <div className="flex items-center gap-2">
                  {activeTicket.workflowStatus === "SENT_TO_BILLING" ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(activeTicket)}
                      disabled={claimMutation.isPending}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Claim This Ticket
                    </Button>
                  ) : isClaimedByMe ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReturnToQueue}
                        disabled={returnToQueueMutation.isPending}
                        className="text-xs h-8 gap-1"
                        title="Release this ticket back to the shared queue"
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
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">
                      Claimed by {activeTicket.billingStaff?.firstName || "another staff member"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Items Table (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Product / Description</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      {isClaimedByMe && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTicket.items.map((item) => (
                      <TableRow key={item.id} className="text-xs">
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {item.product?.name || "Product"}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>SKU: {item.product?.sku || item.productId.slice(0, 8)}</span>
                            {item.variant && (
                              <span className="text-primary font-medium">
                                ({item.variant.name})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{Number(item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isClaimedByMe ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleQuantityChange(item.id, Number(item.quantity), -1)
                                }
                                disabled={Number(item.quantity) <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-bold">
                                {Number(item.quantity)}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleQuantityChange(item.id, Number(item.quantity), 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-bold">{Number(item.quantity)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          ₹{Number(item.totalAmount).toFixed(2)}
                        </TableCell>
                        {isClaimedByMe && (
                          <TableCell className="text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals & Forward Footer */}
              <div className="p-4 border-t bg-muted/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">
                    ₹{Number(activeTicket.subtotalAmount).toFixed(2)}
                  </span>
                </div>
                {Number(activeTicket.discountAmount) > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">
                      -₹{Number(activeTicket.discountAmount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tax Amount</span>
                  <span className="font-mono">
                    ₹{Number(activeTicket.taxAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-bold pt-2 border-t text-foreground">
                  <span>Total Amount Due</span>
                  <span className="font-mono text-primary text-lg">
                    ₹{Number(activeTicket.totalAmount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Primary Action Button */}
                {isClaimedByMe ? (
                  <Button
                    size="lg"
                    className="w-full gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setShowForwardDialog(true)}
                    disabled={sendToPaymentMutation.isPending || activeTicket.items.length === 0}
                  >
                    <Send className="h-4 w-4" />
                    Verify & Send to Cashier
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => handleClaim(activeTicket)}
                    disabled={claimMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Claim Ticket to Verify
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION: FORWARD TO CASHIER DIALOG */}
      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" />
              Send to Cashier Counter
            </DialogTitle>
            <DialogDescription>
              Verify that ticket {activeTicket?.cartNumber} line items and prices are correct before transferring to the cashier for payment collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="bg-muted/40 p-3 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-bold">{activeTicket?.items.length} lines</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bill:</span>
                <span className="font-bold text-primary font-mono text-sm">
                  ₹{Number(activeTicket?.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="forward-notes" className="text-xs">
                Billing Notes for Cashier (Optional)
              </Label>
              <Textarea
                id="forward-notes"
                placeholder="e.g. VIP discount verified, customer paying cash..."
                value={forwardNotes}
                onChange={(e) => setForwardNotes(e.target.value)}
                className="text-xs resize-none h-16"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForwardDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
              onClick={handleSendToPayment}
              disabled={sendToPaymentMutation.isPending}
            >
              {sendToPaymentMutation.isPending ? "Forwarding..." : "Send to Cashier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CANCELLATION DIALOG */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancel POS Transaction
            </DialogTitle>
            <DialogDescription>
              Provide a mandatory reason for cancelling ticket {activeTicket?.cartNumber}. This action is recorded in the audit history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="cancel-reason" className="text-xs font-semibold">
              Cancellation Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Customer changed mind, incorrect barcode scanned..."
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
              onClick={handleCancelTicket}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

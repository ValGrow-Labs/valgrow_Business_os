import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useBillingQueue,
  useClaimBilling,
  useSendToPayment,
  useReturnToQueue,
  useCancelPOSTransaction,
  type POSQueueCartItem,
} from "@/hooks/queries/usePOSWorkflow";
import {
  useAddPOSCartItem,
  useUpdatePOSCartItem,
  useRemovePOSCartItem,
} from "@/hooks/queries/usePOSCarts";
import {
  usePOSProductSearch,
  type POSProductItem,
} from "@/hooks/queries/usePOSProducts";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
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
  ArrowLeft,
} from "lucide-react";

interface BillingDeskProps {
  branchId?: string | undefined;
  warehouseId?: string | undefined;
}

export function BillingDesk({ branchId, warehouseId }: BillingDeskProps) {
  const queryClient = useQueryClient();
  const { formatMoney } = useActiveCurrency();
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

  // Mobile View State ("queue" | "workbench")
  const [mobileView, setMobileView] = useState<"queue" | "workbench">("queue");

  // Keep mobile view synchronized if ticket is deselected
  useEffect(() => {
    if (!selectedCartId) {
      setMobileView("queue");
    }
  }, [selectedCartId]);

  // Dialog States
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardNotes, setForwardNotes] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [addItemSearch, setAddItemSearch] = useState("");

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
  const addItemMutation = useAddPOSCartItem();
  const updateItemMutation = useUpdatePOSCartItem();
  const removeItemMutation = useRemovePOSCartItem();

  // Product Search Query for Adding Items
  const { data: searchResult, isLoading: isSearchLoading } = usePOSProductSearch({
    search: addItemSearch.trim() || undefined,
    warehouseId: activeTicket?.warehouseId || warehouseId || undefined,
    limit: 8,
  });
  const searchProducts: POSProductItem[] = searchResult?.data || [];

  const handleAddProductToTicket = async (product: POSProductItem, variantId?: string) => {
    if (!activeTicket || !isClaimedByMe) return;
    const price = Number(product.retailPrice || product.costPrice || 0);
    try {
      await addItemMutation.mutateAsync({
        cartId: activeTicket.id,
        dto: {
          productId: product.id,
          variantId: variantId || undefined,
          quantity: 1,
          unitPrice: price,
        },
      });
      refetchQueue();
      toast.success(`Added ${product.name} to ticket`);
    } catch (err: any) {
      toast.error("Failed to add product", { description: err.message });
    }
  };

  // Handle Claim
  const handleClaim = async (ticket: POSQueueCartItem) => {
    try {
      await claimMutation.mutateAsync(ticket.id);
      setSelectedCartId(ticket.id);
      setMobileView("workbench");
      // If user was on Pending Claim filter, switch to ALL so ticket remains visible in list
      if (statusFilter === "SENT_TO_BILLING") {
        setStatusFilter("ALL");
      }
      toast.success("Ticket claimed for billing", {
        description: `Ticket ${ticket.cartNumber || ticket.id} is now assigned to you.`,
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        if (
          err.message?.includes("already claimed by you") ||
          ticket.billingStaffId === currentUserId
        ) {
          setSelectedCartId(ticket.id);
          setMobileView("workbench");
          toast.info("Ticket already assigned to you", {
            description: "Opening ticket for review.",
          });
        } else {
          toast.error("Ticket already claimed", {
            description: err.message || "Another billing employee has claimed this ticket.",
          });
        }
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
      setMobileView("queue");
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
      setMobileView("queue");
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
      setMobileView("queue");
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
    <div className="flex flex-col w-full h-full min-h-0 flex-1 gap-3 sm:gap-4 lg:h-[calc(100dvh-140px)]">
      {/* TOP STATS & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-3 sm:p-4 shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">Billing Queue</h2>
              {isRefetching && (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Review and verify customer tickets drafted on the sales floor.
            </p>
          </div>
        </div>

        {/* Filter Pills & Refresh */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex rounded-lg bg-muted p-1 text-xs overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap min-h-[32px] transition-all ${
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
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap min-h-[32px] transition-all ${
                statusFilter === "SENT_TO_BILLING"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending ({allItems.filter((i) => i.workflowStatus === "SENT_TO_BILLING").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CLAIMED_BY_ME")}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap min-h-[32px] transition-all ${
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
            className="h-9 px-3 gap-1.5 shrink-0 min-h-[36px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isQueueLoading ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* MOBILE SEGMENTED CONTROL: Switch between Queue and Active Ticket (when ticket selected) */}
      {activeTicket && (
        <div className="flex items-center gap-1 rounded-lg border bg-surface-2 p-1 lg:hidden text-xs shrink-0">
          <button
            type="button"
            onClick={() => setMobileView("queue")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md font-semibold min-h-[44px] transition-all ${
              mobileView === "queue"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Queue ({filteredItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView("workbench")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md font-semibold min-h-[44px] transition-all ${
              mobileView === "workbench"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span className="truncate">Ticket #{activeTicket.cartNumber || "Active"}</span>
            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 border-current">
              {activeTicket.items.length} items
            </Badge>
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0">
        {/* LEFT COLUMN: TICKET QUEUE LIST (5 COLS) */}
        <div
          className={cn(
            "lg:col-span-5 flex flex-col bg-card border rounded-xl overflow-hidden shadow-xs",
            mobileView === "workbench" ? "hidden lg:flex" : "flex flex-1 min-h-0",
          )}
        >
          {/* Queue Search */}
          <div className="p-3 border-b bg-muted/20 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket #, customer name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-10 text-xs bg-background"
              />
            </div>
          </div>

          {/* Queue List Scrollable */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2.5">
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
                    onClick={() => {
                      setSelectedCartId(ticket.id);
                      setMobileView("workbench");
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                        : "bg-background hover:bg-muted/40 border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
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

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{formatElapsed(ticket.createdAt)}</span>
                      </div>
                    </div>

                    {/* Customer & Salesperson details */}
                    <div className="mt-2 text-xs grid grid-cols-1 sm:grid-cols-2 gap-1 text-muted-foreground">
                      <div className="truncate">
                        <span className="font-medium text-foreground">
                          {ticket.customer?.name || "Walk-in Customer"}
                        </span>
                        {ticket.customer?.phone && (
                          <span className="block text-[11px] opacity-80 truncate">
                            {ticket.customer.phone}
                          </span>
                        )}
                      </div>
                      <div className="sm:text-right truncate">
                        <span className="text-[11px]">Sales: </span>
                        <span className="font-medium text-foreground">
                          {ticket.salesperson
                            ? `${ticket.salesperson.firstName} ${ticket.salesperson.lastName}`
                            : "Floor Staff"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Line: Items count & Total Amount */}
                    <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs gap-2">
                      <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {ticket.items.length} {ticket.items.length === 1 ? "item" : "items"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground font-mono">
                          {formatMoney(ticket.totalAmount)}
                        </span>

                        {isPendingClaim ? (
                          <Button
                            size="sm"
                            className="h-9 sm:h-7 text-xs px-3 sm:px-2.5 font-semibold min-h-[40px] sm:min-h-0"
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
                            className="h-9 sm:h-7 text-xs px-3 sm:px-2.5 font-semibold min-h-[40px] sm:min-h-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCartId(ticket.id);
                              setMobileView("workbench");
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
        <div
          className={cn(
            "lg:col-span-7 flex flex-col bg-card border rounded-xl overflow-hidden shadow-xs",
            mobileView === "queue" && !activeTicket ? "hidden lg:flex" : mobileView === "queue" ? "hidden lg:flex" : "flex flex-1 min-h-0",
          )}
        >
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
                  Select a pending ticket from the queue or click &quot;Claim&quot; to begin verifying items for checkout.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0 flex-1">
              {/* Ticket Workbench Header */}
              <div className="p-3 sm:p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-10 px-2.5 -ml-1 text-xs gap-1 min-h-[44px] text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => setMobileView("queue")}
                    aria-label="Back to ticket queue"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Queue</span>
                  </Button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono font-bold text-sm">
                    {activeTicket.cartNumber?.slice(-4) || "POS"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold tracking-tight truncate">
                        Ticket {activeTicket.cartNumber}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={
                          activeTicket.workflowStatus === "SENT_TO_BILLING"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px]"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/30 text-[11px]"
                        }
                      >
                        {activeTicket.workflowStatus === "SENT_TO_BILLING"
                          ? "Pending Claim"
                          : "In Verification"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Customer:{" "}
                      <span className="font-medium text-foreground">
                        {activeTicket.customer?.name || "Walk-in Retail Customer"}
                      </span>
                      {activeTicket.customer?.phone && ` (${activeTicket.customer.phone})`}
                    </p>
                  </div>
                </div>

                {/* Workbench Top Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activeTicket.workflowStatus === "SENT_TO_BILLING" ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(activeTicket)}
                      disabled={claimMutation.isPending}
                      className="gap-1.5 min-h-[44px] sm:min-h-0 text-xs px-3 font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Claim This Ticket
                    </Button>
                  ) : isClaimedByMe ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAddItemSearch("");
                          setShowAddItemDialog(true);
                        }}
                        className="text-xs h-9 sm:h-8 min-h-[36px] sm:min-h-0 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Product
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReturnToQueue}
                        disabled={returnToQueueMutation.isPending}
                        className="text-xs h-9 sm:h-8 min-h-[36px] sm:min-h-0 gap-1"
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
                          className="text-xs h-9 sm:h-8 min-h-[36px] sm:min-h-0 text-destructive hover:bg-destructive/10 gap-1"
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

              {/* Desktop Items Table (Hidden on small screens) */}
              <div className="hidden md:block flex-1 overflow-y-auto p-4 min-h-0">
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
                          {formatMoney(item.unitPrice)}
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
                          {formatMoney(item.totalAmount)}
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

              {/* Mobile Item Cards (Visible on small screens, avoids table horizontal scroll) */}
              <div className="md:hidden flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 min-h-0">
                {activeTicket.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-background/80 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-foreground text-sm leading-tight">
                          {item.product?.name || "Product"}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>SKU: {item.product?.sku || item.productId.slice(0, 8)}</span>
                          {item.variant && (
                            <span className="text-primary font-medium">({item.variant.name})</span>
                          )}
                        </div>
                      </div>
                      {isClaimedByMe && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 min-h-[36px] min-w-[36px]"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t gap-2">
                      <div className="font-mono text-xs text-muted-foreground">
                        {formatMoney(item.unitPrice)} ea
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        {isClaimedByMe ? (
                          <div className="flex items-center rounded-lg border bg-surface shadow-xs">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-r-none"
                              onClick={() =>
                                handleQuantityChange(item.id, Number(item.quantity), -1)
                              }
                              disabled={Number(item.quantity) <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-8 text-center font-bold text-sm">
                              {Number(item.quantity)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-l-none"
                              onClick={() =>
                                handleQuantityChange(item.id, Number(item.quantity), 1)
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-bold text-sm">Qty: {Number(item.quantity)}</span>
                        )}

                        <span className="font-mono font-bold text-foreground text-sm min-w-16 text-right">
                          {formatMoney(item.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals & Forward Footer */}
              <div className="p-3 sm:p-4 border-t bg-muted/10 space-y-2.5 sm:space-y-3 shrink-0 pb-safe">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatMoney(activeTicket.subtotalAmount)}</span>
                </div>
                {Number(activeTicket.discountAmount) > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">-{formatMoney(activeTicket.discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tax Amount</span>
                  <span className="font-mono">{formatMoney(activeTicket.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold pt-2 border-t text-foreground">
                  <span>Total Amount Due</span>
                  <span className="font-mono text-primary text-lg sm:text-xl">
                    {formatMoney(activeTicket.totalAmount)}
                  </span>
                </div>

                {/* Primary Action Button */}
                {isClaimedByMe ? (
                  <Button
                    size="lg"
                    className="w-full gap-2 font-bold min-h-[48px] text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => setShowForwardDialog(true)}
                    disabled={sendToPaymentMutation.isPending || activeTicket.items.length === 0}
                  >
                    <Send className="h-5 w-5" />
                    Verify &amp; Send to Cashier
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                ) : activeTicket.workflowStatus === "SENT_TO_BILLING" ? (
                  <Button
                    size="lg"
                    className="w-full gap-2 font-bold min-h-[48px] text-sm sm:text-base shadow-sm"
                    onClick={() => handleClaim(activeTicket)}
                    disabled={claimMutation.isPending}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Claim &amp; Verify Ticket
                  </Button>
                ) : (
                  <div className="text-center p-2.5 text-xs text-muted-foreground bg-muted/40 rounded-lg">
                    Ticket is claimed by {activeTicket.billingStaff?.firstName || "another staff member"}.
                  </div>
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
                  {formatMoney(activeTicket?.totalAmount)}
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

      {/* ADD PRODUCT DIALOG */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Product to Ticket #{activeTicket?.cartNumber || activeTicket?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription>
              Search and add items to verify or update the customer&apos;s order before billing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or scan barcode..."
                value={addItemSearch}
                onChange={(e) => setAddItemSearch(e.target.value)}
                className="pl-9 text-xs"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
              {isSearchLoading ? (
                <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Searching inventory…
                </div>
              ) : searchProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No products found matching &quot;{addItemSearch}&quot;
                </div>
              ) : (
                searchProducts.map((p) => {
                  const unitPrice = Number(p.retailPrice || p.costPrice || 0);
                  const onHand = Number(p.availableStock ?? 0);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-colors text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-semibold text-foreground truncate">{p.name}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                          <span>SKU: {p.sku || p.id.slice(0, 8)}</span>
                          <span>Stock: {onHand}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-foreground">
                          {formatMoney(unitPrice)}
                        </span>
                        <Button
                          size="sm"
                          className="h-8 text-xs px-3 font-semibold min-h-[36px]"
                          disabled={addItemMutation.isPending || onHand <= 0}
                          onClick={() => handleAddProductToTicket(p)}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddItemDialog(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

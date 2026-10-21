import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/foundation/states";
import { PageGuideButton } from "@/components/onboarding/page-guide";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { useBranches, type BranchItem } from "@/hooks/queries/useBranches";
import { useWarehouses, type WarehouseItem } from "@/hooks/queries/useWarehouses";
import { useCustomers, useCreateCustomer, type CustomerItem } from "@/hooks/queries/useCustomers";
import { toast } from "sonner";
import {
  usePOSSessions,
  useOpenPOSSession,
  useClosePOSSession,
  useSuspendPOSSession,
  useResumePOSSession,
  type POSSessionItem,
} from "@/hooks/queries/usePOSSessions";
import {
  usePOSProductSearch,
  findPOSProductByBarcode,
  type POSProductItem,
} from "@/hooks/queries/usePOSProducts";
import {
  usePOSCart,
  useCreatePOSCart,
  useUpdatePOSCart,
  useAddPOSCartItem,
  useUpdatePOSCartItem,
  useRemovePOSCartItem,
  useHoldPOSCart,
  useResumePOSCart,
  useClearPOSCart,
} from "@/hooks/queries/usePOSCarts";
import { usePOSSales } from "@/hooks/queries/usePOSCheckout";
import { useSendToBilling } from "@/hooks/queries/usePOSWorkflow";
import { BillingDesk } from "@/components/pos/billing-desk";
import { CashierCounter } from "@/components/pos/cashier-counter";
import { downloadFile, getActiveOrgId } from "@/lib/api-client";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Calculator,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Printer,
  Building2,
  Warehouse,
  User,
  ShoppingBag,
  AlertCircle,
  X,
  RefreshCw,
  Send,
  Receipt,
  CreditCard,
  Lock,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "Point of Sale (POS) · ValGrow Business OS" },
      {
        name: "description",
        content:
          "Multi-user retail POS system supporting salesperson terminals, billing desk queue, and cashier counter.",
      },
    ],
  }),
  component: POSRegisterPage,
});

type POSTab = "register" | "billing" | "cashier";

function POSRegisterPage() {
  const queryClient = useQueryClient();
  const { currencyCode, currencySymbol, formatMoney } = useActiveCurrency();
  const { data: currentUser } = useCurrentUser();
  const isOwner = currentUser?.role?.name === "Owner";
  const permissions = currentUser?.permissions || [];
  const canOpenSession = isOwner || permissions.includes("pos.session");
  const canCloseSession = isOwner || permissions.includes("pos.close");
  const canCheckout = isOwner || permissions.includes("pos.checkout");
  const canRefund = isOwner || permissions.includes("pos.refund");
  const canBilling = isOwner || permissions.includes("pos.billing");
  const canCashier = isOwner || permissions.includes("pos.cashier");
  const canCreateCart = isOwner || permissions.includes("pos.create");

  const isSalesperson = currentUser?.role?.name === "Salesperson" || (!canBilling && !canCashier && !isOwner);
  const isBillingStaff = currentUser?.role?.name === "Billing Staff" || (canBilling && !canCashier && !isOwner);
  const isCashier = currentUser?.role?.name === "Cashier" || (canCashier && !canBilling && !isOwner);

  // Determine initial active tab based on role & permissions
  const [activeTab, setActiveTab] = useState<POSTab>(() => {
    if (isBillingStaff) return "billing";
    if (isCashier) return "cashier";
    return "register";
  });

  // Mobile Sales Register View switcher ("catalog" | "cart")
  const [mobileSalesView, setMobileSalesView] = useState<"catalog" | "cart">("catalog");

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role?.name === "Billing Staff" || (canBilling && !canCashier && !isOwner)) {
        setActiveTab("billing");
      } else if (currentUser.role?.name === "Cashier" || (canCashier && !canBilling && !isOwner)) {
        setActiveTab("cashier");
      }
    }
  }, [currentUser?.role?.name, canBilling, canCashier, isOwner]);

  const activeOrgId = currentUser?.activeOrganization?.id || getActiveOrgId() || undefined;

  // Masters (scoped to active organization)
  const {
    data: branchesRes,
    isLoading: isBranchesLoading,
    isError: isBranchesError,
    error: branchesError,
    refetch: refetchBranches,
  } = useBranches(activeOrgId);

  const {
    data: warehousesRes,
    isLoading: isWarehousesLoading,
    isError: isWarehousesError,
    error: warehousesError,
    refetch: refetchWarehouses,
  } = useWarehouses(activeOrgId);

  const { data: customersRes } = useCustomers();

  const branches: BranchItem[] = branchesRes || [];
  const warehouses: WarehouseItem[] = warehousesRes || [];
  const customers: CustomerItem[] = customersRes || [];

  // Active POS Session Query (scoped to active organization)
  const { data: openSessions, isLoading: isSessionLoading } = usePOSSessions(
    "OPEN",
    undefined,
    activeOrgId,
  );
  const activeSession: POSSessionItem | undefined = openSessions?.[0];

  // Open Session / Salesperson Setup Form State
  const [openSessionBranchId, setOpenSessionBranchId] = useState("");
  const [openSessionWarehouseId, setOpenSessionWarehouseId] = useState("");
  const [openSessionTerminalId, setOpenSessionTerminalId] = useState("REG-01");
  const [openSessionOpeningCash, setOpenSessionOpeningCash] = useState("1000");
  const [salespersonTerminalActive, setSalespersonTerminalActive] = useState(false);

  // Track active organization ID changes: refresh queries and clear selections
  const prevOrgIdRef = useRef<string | undefined>(activeOrgId);
  useEffect(() => {
    if (prevOrgIdRef.current && prevOrgIdRef.current !== activeOrgId) {
      setOpenSessionBranchId("");
      setOpenSessionWarehouseId("");
      refetchBranches();
      refetchWarehouses();
    }
    prevOrgIdRef.current = activeOrgId;
  }, [activeOrgId, refetchBranches, refetchWarehouses]);

  // When branches load/update: clear branch selection if it does not belong to the current organization
  useEffect(() => {
    if (openSessionBranchId && branches.length > 0) {
      const exists = branches.some((b) => b.id === openSessionBranchId);
      if (!exists) {
        setOpenSessionBranchId("");
        setOpenSessionWarehouseId("");
      }
    }
  }, [branches, openSessionBranchId]);

  // Auto-initialize branch selection when there is exactly one branch
  useEffect(() => {
    if (!openSessionBranchId && branches.length === 1 && branches[0]?.id) {
      setOpenSessionBranchId(branches[0].id);
    }
  }, [branches, openSessionBranchId]);

  // Compute warehouses compatible with the selected branch and active organization
  const availableWarehouses = useMemo(() => {
    return warehouses.filter((w: WarehouseItem) => {
      if (activeOrgId && w.organizationId && w.organizationId !== activeOrgId) {
        return false;
      }
      if (w.status && w.status !== "ACTIVE") {
        return false;
      }
      if (openSessionBranchId) {
        if (w.branchId) {
          return w.branchId === openSessionBranchId;
        }
        return true; // Depot / organization-wide warehouse (branchId is null or empty)
      }
      return !w.branchId;
    });
  }, [warehouses, activeOrgId, openSessionBranchId]);

  // Manage warehouse selection:
  // - Clear if selected warehouse does not belong to availableWarehouses
  // - Automatically select warehouse only when there is exactly one valid option; otherwise require user choice
  useEffect(() => {
    if (openSessionWarehouseId) {
      const isValid = availableWarehouses.some((w) => w.id === openSessionWarehouseId);
      if (!isValid) {
        setOpenSessionWarehouseId("");
      }
    }

    if (openSessionBranchId && availableWarehouses.length === 1 && availableWarehouses[0]?.id) {
      if (openSessionWarehouseId !== availableWarehouses[0].id) {
        setOpenSessionWarehouseId(availableWarehouses[0].id);
      }
    }
  }, [openSessionBranchId, availableWarehouses, openSessionWarehouseId]);

  // Effective branch and warehouse for salesperson / register
  const effectiveBranchId = activeSession?.branchId || openSessionBranchId;
  const effectiveWarehouseId = activeSession?.warehouseId || openSessionWarehouseId;

  const openSessionMutation = useOpenPOSSession();
  const closeSessionMutation = useClosePOSSession();
  const suspendSessionMutation = useSuspendPOSSession();
  const resumeSessionMutation = useResumePOSSession();

  // Close Session Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingCash, setClosingCash] = useState("0");
  const [closeNotes, setCloseNotes] = useState("");

  // Cart State
  const [activeCartId, setActiveCartId] = useState<string | null>(null);
  const { data: activeCart } = usePOSCart(activeCartId || undefined);

  // Cart is locked if it has been submitted to billing or beyond
  const isCartLocked = Boolean(
    activeCart?.workflowStatus && activeCart.workflowStatus !== "DRAFT",
  );

  const createCartMutation = useCreatePOSCart();
  const updateCartMutation = useUpdatePOSCart();
  const addItemMutation = useAddPOSCartItem();
  const updateItemMutation = useUpdatePOSCartItem();
  const removeItemMutation = useRemovePOSCartItem();
  const holdCartMutation = useHoldPOSCart();
  const resumeCartMutation = useResumePOSCart();
  const clearCartMutation = useClearPOSCart();
  const sendToBillingMutation = useSendToBilling();

  // Multi-user Send to Billing State
  const [showSendToBillingModal, setShowSendToBillingModal] = useState(false);
  const [sendToBillingNotes, setSendToBillingNotes] = useState("");
  const [ticketConfirmation, setTicketConfirmation] = useState<{
    ticketNumber: string;
    totalAmount: number;
    itemCount: number;
    customerName?: string | undefined;
  } | null>(null);

  // Auto-create cart when session becomes active (only resume DRAFT carts)
  useEffect(() => {
    if (activeSession && !activeCartId) {
      if (activeSession.carts && activeSession.carts.length > 0) {
        const activeDraftCart = activeSession.carts.find(
          (c: { status: string; workflowStatus?: string }) =>
            c.status === "ACTIVE" && (!c.workflowStatus || c.workflowStatus === "DRAFT"),
        );
        if (activeDraftCart) {
          setActiveCartId(activeDraftCart.id);
          return;
        }
      }
      createCartMutation.mutate(
        {
          branchId: activeSession.branchId,
          warehouseId: activeSession.warehouseId,
          sessionId: activeSession.id,
        },
        {
          onSuccess: (newCart) => setActiveCartId(newCart.id),
        },
      );
    }
  }, [activeSession, activeCartId]);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const { data: searchResult, isLoading: isProductsLoading } = usePOSProductSearch({
    search: searchQuery || undefined,
    warehouseId: effectiveWarehouseId || undefined,
    limit: 12,
  });
  const products = searchResult?.data || [];

  // Core Barcode Scanning Processor (Shared by manual form and USB scanner listener)
  const processBarcodeScan = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    if (!effectiveBranchId || !effectiveWarehouseId) {
      setBarcodeError("Please select a branch and warehouse first");
      return;
    }

    setBarcodeError(null);
    setIsSearchingBarcode(true);

    try {
      const match = await findPOSProductByBarcode(cleanCode);
      if (match) {
        let targetCartId = activeCartId;

        // If no active cart, or if current cart is locked (already sent to billing), start a new draft cart
        if (!targetCartId || isCartLocked) {
          const newCart = await createCartMutation.mutateAsync({
            branchId: effectiveBranchId,
            warehouseId: effectiveWarehouseId,
            sessionId: activeSession?.id,
          });
          targetCartId = newCart.id;
          setActiveCartId(newCart.id);
          if (isCartLocked) {
            toast.info(`Started fresh cart #${newCart.cartNumber || newCart.id.slice(0, 8)}`);
          }
        }

        if (targetCartId) {
          await addItemMutation.mutateAsync({
            cartId: targetCartId,
            dto: {
              productId: match.product.id,
              variantId: match.variant?.id || undefined,
              quantity: 1,
              unitPrice: Number(match.price || 0),
            },
          });
        }
        setBarcodeInput("");
      } else {
        setBarcodeError(`No product found matching barcode "${cleanCode}"`);
      }
    } catch {
      setBarcodeError("Error scanning barcode. Please try again.");
    } finally {
      setIsSearchingBarcode(false);
      barcodeRef.current?.focus();
    }
  };

  // Barcode Submission Handler (Manual Input Form)
  const handleBarcodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;
    await processBarcodeScan(barcodeInput);
  };

  // Add Product Card Handler
  const handleAddProductToCart = async (product: POSProductItem, variantId?: string) => {
    if (!effectiveBranchId || !effectiveWarehouseId) {
      toast.error("Please select a branch and warehouse first");
      return;
    }

    let targetCartId = activeCartId;

    // If no cart or if cart is locked, automatically start a fresh cart
    if (!targetCartId || isCartLocked) {
      const newCart = await createCartMutation.mutateAsync({
        branchId: effectiveBranchId,
        warehouseId: effectiveWarehouseId,
        sessionId: activeSession?.id,
      });
      targetCartId = newCart.id;
      setActiveCartId(newCart.id);
      if (isCartLocked) {
        toast.info(`Started fresh cart #${newCart.cartNumber || newCart.id.slice(0, 8)}`);
      }
    }

    const price = Number(product.retailPrice || product.costPrice || 0);
    await addItemMutation.mutateAsync({
      cartId: targetCartId,
      dto: {
        productId: product.id,
        variantId: variantId || undefined,
        quantity: 1,
        unitPrice: price,
      },
    });
  };

  // Start Next Cart Handler (used after Send to Billing or manually)
  const handleStartNewCart = async () => {
    setTicketConfirmation(null);
    setMobileSalesView("catalog");
    if (!effectiveBranchId || !effectiveWarehouseId) {
      setActiveCartId(null);
      return;
    }

    try {
      const newCart = await createCartMutation.mutateAsync({
        branchId: effectiveBranchId,
        warehouseId: effectiveWarehouseId,
        sessionId: activeSession?.id,
        customerId: selectedCustomerId !== "walkin" ? selectedCustomerId : undefined,
      });
      setActiveCartId(newCart.id);
      setSelectedCustomerId("walkin");
      toast.success("Ready for next customer");
    } catch (err: any) {
      toast.error(err.message || "Failed to start new cart");
    }
  };

  // Confirm Send to Billing Handler
  const handleConfirmSendToBilling = async () => {
    if (!activeCartId) return;
    try {
      const custId = selectedCustomerId !== "walkin" ? selectedCustomerId : null;
      const result = await sendToBillingMutation.mutateAsync({
        cartId: activeCartId,
        customerId: custId,
        notes: sendToBillingNotes.trim() || undefined,
      });

      const assignedNumber = result.cartNumber || activeCart?.cartNumber || result.id.slice(0, 8);
      const custName =
        result.customer?.name ||
        (selectedCustomerId !== "walkin"
          ? customers.find((c) => c.id === selectedCustomerId)?.name
          : "Walk-in Customer");

      setTicketConfirmation({
        ticketNumber: assignedNumber,
        totalAmount: Number(result.totalAmount || activeCart?.totalAmount || 0),
        itemCount: (activeCart?.items ?? []).reduce(
          (sum, it) => sum + Number(it.quantity || 0),
          0,
        ),
        customerName: custName,
      });

      setShowSendToBillingModal(false);
      setSendToBillingNotes("");
      toast.success(`Ticket #${assignedNumber} queued for Billing Desk!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send ticket to billing");
    }
  };

  const handleDownloadReceipt = async (saleId?: string, receiptNum?: string) => {
    if (!saleId) return;
    try {
      await downloadFile(`/pos/sales/${saleId}/receipt`, `${receiptNum || "POS-Receipt"}.pdf`);
    } catch (err: any) {
      alert(err.message || "Failed to download POS receipt PDF");
    }
  };

  // Cashier / Staff Identification
  const cashierName = currentUser?.user
    ? `${currentUser.user.firstName || ""} ${currentUser.user.lastName || ""}`.trim() ||
      currentUser.user.email
    : "Staff";

  // Quick Add Customer State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerCode, setNewCustomerCode] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState<string>("0");
  const [newCustomerPaymentTerms, setNewCustomerPaymentTerms] = useState("NET30");
  const [newCustomerTaxId, setNewCustomerTaxId] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [manualCashierName, setManualCashierName] = useState("");
  const [createCustomerError, setCreateCustomerError] = useState<string | null>(null);
  const createCustomerMutation = useCreateCustomer();

  const generateCustomerCode = () =>
    `CUST-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

  const resetAddCustomerForm = () => {
    setNewCustomerName("");
    setNewCustomerCode(generateCustomerCode());
    setNewCustomerEmail("");
    setNewCustomerPhone("");
    setNewCustomerCreditLimit("0");
    setNewCustomerPaymentTerms("NET30");
    setNewCustomerTaxId("");
    setNewCustomerCity("");
    setManualCashierName("");
    setCreateCustomerError(null);
  };

  // Quick Add Customer Submission Handler
  const handleQuickAddCustomer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nameTrimmed = newCustomerName.trim();
    if (!nameTrimmed) {
      setCreateCustomerError("Customer Name is required.");
      return;
    }

    const cashierTrimmed = manualCashierName.trim();
    if (!cashierTrimmed) {
      setCreateCustomerError("Cashier Name is required.");
      return;
    }

    const finalCode = newCustomerCode.trim() || generateCustomerCode();

    if (newCustomerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newCustomerEmail.trim())) {
        setCreateCustomerError("Please enter a valid email address.");
        return;
      }
    }

    if (newCustomerCreditLimit !== "" && Number(newCustomerCreditLimit) < 0) {
      setCreateCustomerError("Credit limit cannot be negative.");
      return;
    }

    setCreateCustomerError(null);
    try {
      const payload: {
        customerCode: string;
        name: string;
        email?: string;
        phone?: string;
        currency?: string;
        creditLimit?: number;
        paymentTerms?: string;
        taxIdNumber?: string;
        city?: string;
      } = {
        customerCode: finalCode,
        name: nameTrimmed,
        currency: currencyCode || "INR",
      };

      if (newCustomerEmail.trim()) {
        payload.email = newCustomerEmail.trim();
      }
      if (newCustomerPhone.trim()) {
        payload.phone = newCustomerPhone.trim();
      }
      if (newCustomerCreditLimit !== "" && !isNaN(Number(newCustomerCreditLimit))) {
        payload.creditLimit = Number(newCustomerCreditLimit);
      }
      if (newCustomerPaymentTerms.trim()) {
        payload.paymentTerms = newCustomerPaymentTerms.trim();
      }
      if (newCustomerTaxId.trim()) {
        payload.taxIdNumber = newCustomerTaxId.trim();
      }
      if (newCustomerCity.trim()) {
        payload.city = newCustomerCity.trim();
      }

      const createdCustomer = await createCustomerMutation.mutateAsync(payload);

      queryClient.setQueryData<CustomerItem[]>(["customers"], (old) => {
        if (!old) return [createdCustomer];
        const exists = old.some((c) => c.id === createdCustomer.id);
        return exists ? old : [...old, createdCustomer];
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      setShowAddCustomerModal(false);
      resetAddCustomerForm();
      setSelectedCustomerId(createdCustomer.id);
      if (activeCartId && !isCartLocked) {
        try {
          await updateCartMutation.mutateAsync({
            cartId: activeCartId,
            dto: { customerId: createdCustomer.id },
          });
        } catch (updateErr: any) {
          console.error("Failed to link new customer to active cart", updateErr);
        }
      }
      toast.success(`Customer "${createdCustomer.name}" created and selected`);
    } catch (err: any) {
      setCreateCustomerError(err.message || "Failed to create customer");
    }
  };

  // Held Carts Modal State
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Selected Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walkin");

  // Keep selectedCustomerId in sync with activeCart
  useEffect(() => {
    if (activeCart?.customerId) {
      setSelectedCustomerId(activeCart.customerId);
    } else if (activeCart && !activeCart.customerId) {
      setSelectedCustomerId("walkin");
    }
  }, [activeCart?.id, activeCart?.customerId]);

  const handleCustomerSelect = async (val: string) => {
    setSelectedCustomerId(val);
    if (activeCartId && !isCartLocked) {
      const custId = val === "walkin" ? null : val;
      try {
        await updateCartMutation.mutateAsync({
          cartId: activeCartId,
          dto: { customerId: custId },
        });
      } catch (err: any) {
        console.error("Failed to update cart customer", err);
      }
    }
  };



  // Refunds Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  usePOSSales(activeSession?.id);

  // Global USB HID Barcode Scanner Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;
    const INTER_CHAR_TIMEOUT = 50; // ms threshold for USB HID rapid key stream

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore if not in register tab
      if (activeTab !== "register") return;

      // 2. Ignore if no branch/warehouse context
      if (!effectiveBranchId || !effectiveWarehouseId) return;

      // 3. Ignore if any modal/dialog is open
      if (
        showCloseModal ||
        showHeldModal ||
        showRefundModal ||
        showAddCustomerModal ||
        showSendToBillingModal ||
        Boolean(ticketConfirmation)
      ) {
        buffer = "";
        return;
      }

      // 4. Ignore if active element is a text input, textarea, select, or contenteditable
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditable =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable;

      if (isEditable) {
        buffer = "";
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // Reset buffer if delay between keystrokes exceeds rapid scan threshold
      if (lastKeyTime > 0 && timeDiff > INTER_CHAR_TIMEOUT) {
        buffer = "";
      }

      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.length >= 2) {
          e.preventDefault();
          const scannedCode = buffer;
          buffer = "";
          processBarcodeScan(scannedCode);
        } else {
          buffer = "";
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeTab,
    effectiveBranchId,
    effectiveWarehouseId,
    activeSession,
    activeCartId,
    isCartLocked,
    showCloseModal,
    showHeldModal,
    showRefundModal,
    showAddCustomerModal,
    showSendToBillingModal,
    ticketConfirmation,
  ]);

  // Loading state
  if (isSessionLoading) {
    return (
      <AppShell>
        <div className="flex h-96 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
          Loading POS workspace…
        </div>
      </AppShell>
    );
  }

  // Top Tab Navigation Bar Component
  const renderTopNavBar = () => (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b bg-surface px-3 py-2 sm:px-6 shrink-0">
      <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1 rounded-lg border bg-surface-2 p-1 shrink-0">
          {(canCreateCart || isOwner) && !isBillingStaff && !isCashier && (
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all min-h-[36px] sm:min-h-0 ${
                activeTab === "register"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span>Sales Register</span>
            </button>
          )}

          {(canBilling || isOwner) && !isSalesperson && !isCashier && (
            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all min-h-[36px] sm:min-h-0 ${
                activeTab === "billing"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="h-3.5 w-3.5 text-amber-500" />
              <span>Billing Desk</span>
            </button>
          )}

          {(canCashier || canCheckout || isOwner) && !isSalesperson && !isBillingStaff && (
            <button
              type="button"
              onClick={() => setActiveTab("cashier")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all min-h-[36px] sm:min-h-0 ${
                activeTab === "cashier"
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
              <span>Cashier Counter</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <PageGuideButton id="pos" />
        {activeSession ? (
          <div className="flex items-center gap-2">
            <Badge variant={activeSession.status === "OPEN" ? "success" : "warning"} className="text-xs">
              <span
                className={
                  activeSession.status === "OPEN"
                    ? "h-1.5 w-1.5 animate-pulse rounded-full bg-success"
                    : "h-1.5 w-1.5 rounded-full bg-warning"
                }
              />
              {activeSession.terminalId} · {activeSession.status}
            </Badge>

            {canCloseSession && (
              <Button
                variant="outline"
                size="xs"
                className="text-destructive hover:bg-destructive-soft hover:text-destructive min-h-[32px]"
                onClick={() => {
                  setClosingCash(String(activeSession.openingCash || 0));
                  setShowCloseModal(true);
                }}
              >
                Close register
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Multi-User Mode
            </Badge>
          </div>
        )}
      </div>
    </div>
  );

  // Render Billing Desk Tab
  if (activeTab === "billing") {
    return (
      <AppShell fullBleed>
        <div className="flex flex-col flex-1 h-full min-h-0 lg:h-[calc(100dvh-3.5rem)] overflow-hidden">
          {renderTopNavBar()}
          <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-4">
            <BillingDesk branchId={effectiveBranchId} warehouseId={effectiveWarehouseId} />
          </div>
        </div>
      </AppShell>
    );
  }

  // Render Cashier Counter Tab
  if (activeTab === "cashier") {
    return (
      <AppShell fullBleed>
        <div className="flex flex-col flex-1 h-full min-h-0 lg:h-[calc(100dvh-3.5rem)] overflow-hidden">
          {renderTopNavBar()}
          <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-4">
            <CashierCounter
              branchId={effectiveBranchId}
              warehouseId={effectiveWarehouseId}
              activeSession={activeSession}
            />
          </div>
        </div>
      </AppShell>
    );
  }

  // REGISTER TAB: Check if terminal has an active session OR active salesperson setup
  const isTerminalReady = Boolean(activeSession || salespersonTerminalActive);

  if (!isTerminalReady) {
    return (
      <AppShell fullBleed>
        <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
          {renderTopNavBar()}

          <div className="mx-auto w-full max-w-lg py-6 sm:py-10 px-4">
            <div className="panel overflow-hidden shadow-sm">
              <div className="border-b bg-surface-2/60 px-6 py-6 sm:px-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Calculator className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">Sales Register Setup</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select your dispatch branch and warehouse to start scanning products and building
                  customer orders.
                </p>
              </div>

              <div className="space-y-5 px-6 py-6 sm:px-8">
                {/* Branch Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Branch</Label>
                    {isBranchesLoading && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Loading branches…
                      </span>
                    )}
                  </div>

                  {isBranchesError ? (
                    <div
                      role="alert"
                      className="flex flex-col gap-2 rounded-md border border-destructive/20 bg-destructive-soft p-3 text-[13px] text-destructive"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="flex-1">
                          {(branchesError as any)?.message || "Failed to load branches."}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="self-start text-xs border-destructive/30 hover:bg-destructive/10"
                        onClick={() => refetchBranches()}
                      >
                        <RotateCcw className="mr-1.5 h-3 w-3" />
                        Retry loading branches
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={openSessionBranchId}
                      onValueChange={(val) => {
                        setOpenSessionBranchId(val);
                        if (openSessionWarehouseId) {
                          const isStillValid = warehouses.some(
                            (w) =>
                              w.id === openSessionWarehouseId && (!w.branchId || w.branchId === val),
                          );
                          if (!isStillValid) {
                            setOpenSessionWarehouseId("");
                          }
                        }
                      }}
                      disabled={isBranchesLoading || branches.length === 0}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue
                          placeholder={
                            isBranchesLoading
                              ? "Loading branches…"
                              : branches.length === 0
                                ? "No branches available"
                                : "Select Branch"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b: BranchItem) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name} ({b.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Warehouse Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Warehouse / Dispatched From</Label>
                    {isWarehousesLoading && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Loading warehouses…
                      </span>
                    )}
                  </div>

                  {isWarehousesError ? (
                    <div
                      role="alert"
                      className="flex flex-col gap-2 rounded-md border border-destructive/20 bg-destructive-soft p-3 text-[13px] text-destructive"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="flex-1">
                          {(warehousesError as any)?.message || "Failed to load warehouses."}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="self-start text-xs border-destructive/30 hover:bg-destructive/10"
                        onClick={() => refetchWarehouses()}
                      >
                        <RotateCcw className="mr-1.5 h-3 w-3" />
                        Retry loading warehouses
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={openSessionWarehouseId}
                      onValueChange={setOpenSessionWarehouseId}
                      disabled={
                        isWarehousesLoading ||
                        !openSessionBranchId ||
                        availableWarehouses.length === 0
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue
                          placeholder={
                            isWarehousesLoading
                              ? "Loading warehouses…"
                              : !openSessionBranchId
                                ? "Select a branch first"
                                : warehouses.length === 0
                                  ? "No warehouses in organization"
                                  : availableWarehouses.length === 0
                                    ? "No warehouses for selected branch"
                                    : "Select Warehouse"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWarehouses.map((w: WarehouseItem) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name} ({w.code}){!w.branchId ? " • All branches" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Cash Drawer Float & Terminal ID (For users with pos.session / cashiers) */}
                {canOpenSession && (
                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                    <div className="space-y-1.5">
                      <Label>Terminal ID</Label>
                      <Input
                        value={openSessionTerminalId}
                        onChange={(e) => setOpenSessionTerminalId(e.target.value)}
                        className="h-10 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cash Float ({currencySymbol})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={openSessionOpeningCash}
                        onChange={(e) => setOpenSessionOpeningCash(e.target.value)}
                        className="tabular h-10"
                      />
                    </div>
                  </div>
                )}

                {openSessionMutation.isError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive-soft p-3 text-[13px] text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {(openSessionMutation.error as any)?.message || "Failed to open POS session"}
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  {/* Action 1: Floor Salesperson Terminal (No cash drawer required) */}
                  <Button
                    type="button"
                    size="lg"
                    className="w-full text-sm font-semibold"
                    disabled={!openSessionBranchId || !openSessionWarehouseId}
                    onClick={() => {
                      setSalespersonTerminalActive(true);
                      if (!activeCartId) {
                        createCartMutation.mutate(
                          {
                            branchId: openSessionBranchId,
                            warehouseId: openSessionWarehouseId,
                          },
                          {
                            onSuccess: (newCart) => setActiveCartId(newCart.id),
                          },
                        );
                      }
                    }}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Start Salesperson Terminal
                  </Button>

                  {/* Action 2: Open Register Session (With Cash Drawer & Float) */}
                  {canOpenSession && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full text-sm font-medium"
                      disabled={
                        !openSessionBranchId ||
                        !openSessionWarehouseId ||
                        openSessionMutation.isPending
                      }
                      onClick={() => {
                        openSessionMutation.mutate({
                          branchId: openSessionBranchId,
                          warehouseId: openSessionWarehouseId,
                          terminalId: openSessionTerminalId,
                          openingCash: Number(openSessionOpeningCash),
                        });
                      }}
                    >
                      {openSessionMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Opening Cash Register…
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2 h-4 w-4" />
                          Open Cash Register & Float
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const cartItems = activeCart?.items ?? [];
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const money = (n: unknown) => formatMoney(n as number);

  // MAIN ACTIVE REGISTER / SALESPERSON TERMINAL UI
  return (
    <AppShell fullBleed>
      <div className="flex flex-col flex-1 h-full min-h-0 lg:h-[calc(100dvh-3.5rem)] overflow-hidden">
        {renderTopNavBar()}

        {/* TERMINAL STATUS & ACTIONS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface-2/40 px-4 py-2 sm:px-6 shrink-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary">
                <Calculator className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold">
                {activeSession ? activeSession.terminalId : "Floor Terminal"}
              </span>
              <Badge variant={activeSession ? "success" : "neutral"} className="text-[11px]">
                {activeSession ? "Register Active" : "Floor Salesperson"}
              </Badge>
            </div>

            <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {branches.find((b) => b.id === effectiveBranchId)?.name || "Branch"}
              </span>
              <span className="flex items-center gap-1">
                <Warehouse className="h-3.5 w-3.5" />
                {warehouses.find((w) => w.id === effectiveWarehouseId)?.name || "Warehouse"}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>Salesperson:</span>
                <span className="font-semibold text-foreground">{cashierName}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {activeSession && activeSession.status === "OPEN" ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => suspendSessionMutation.mutate(activeSession.id)}
                disabled={suspendSessionMutation.isPending}
              >
                <PauseCircle />
                Suspend
              </Button>
            ) : activeSession ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => resumeSessionMutation.mutate(activeSession.id)}
                disabled={resumeSessionMutation.isPending}
              >
                <Play className="text-success" />
                Resume
              </Button>
            ) : null}

            <Button variant="ghost" size="xs" onClick={() => setShowHeldModal(true)}>
              <PauseCircle />
              Held sales
            </Button>

            {canRefund && (
              <Button variant="ghost" size="xs" onClick={() => setShowRefundModal(true)}>
                <RotateCcw />
                Refunds
              </Button>
            )}

            {!activeSession && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSalespersonTerminalActive(false)}
              >
                Change branch
              </Button>
            )}
          </div>
        </div>

        {/* MOBILE VIEW SWITCHER (Catalog vs Cart) */}
        <div className="flex lg:hidden items-center p-1 bg-surface-2 border-b gap-1 shrink-0 px-3 py-1.5">
          <button
            type="button"
            onClick={() => setMobileSalesView("catalog")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] flex items-center justify-center gap-1.5 ${
              mobileSalesView === "catalog"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Products</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSalesView("cart")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] flex items-center justify-center gap-1.5 ${
              mobileSalesView === "cart"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Cart {cartCount > 0 ? `(${cartCount} · ${money(activeCart?.totalAmount)})` : "(Empty)"}</span>
          </button>
        </div>

        {/* MAIN TWO-PANE REGISTER */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* LEFT: SCAN + CATALOG */}
          <div
            className={`flex min-h-0 flex-col gap-4 p-3 sm:p-6 flex-1 overflow-y-auto ${
              mobileSalesView !== "catalog" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={barcodeRef}
                    type="text"
                    placeholder="Scan or enter barcode / SKU…"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="h-11 pl-10 font-mono text-sm"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 px-4"
                  disabled={isSearchingBarcode || !barcodeInput.trim()}
                >
                  {isSearchingBarcode ? <RefreshCw className="animate-spin" /> : "Add"}
                </Button>
              </form>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search catalog by name or SKU…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-9"
                />
              </div>
            </div>

            <AnimatePresence>
              {barcodeError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  role="alert"
                  className="-mt-1 flex items-center gap-1.5 text-[13px] text-destructive"
                >
                  <AlertCircle className="h-4 w-4" />
                  {barcodeError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isProductsLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="panel h-[116px] p-3">
                      <div className="shimmer h-3.5 w-3/4 rounded bg-muted" />
                      <div className="shimmer mt-2 h-3 w-1/2 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <EmptyState
                  icon={<ShoppingBag className="h-5 w-5" />}
                  title={searchQuery ? `No products match "${searchQuery}"` : "No products available"}
                  description="Try a different name or SKU, or scan a barcode."
                />
              ) : (
                <motion.div
                  variants={staggerContainer(0.025)}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4"
                >
                  {products.map((prod) => {
                    const stock = prod.availableStock ?? 0;
                    return (
                      <motion.button
                        key={prod.id}
                        type="button"
                        variants={staggerItem}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleAddProductToCart(prod)}
                        className="group panel relative flex min-h-[116px] flex-col justify-between p-3 text-left transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                            {prod.name}
                          </div>
                          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                            {prod.sku}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
                          <span className="tabular text-sm font-semibold text-foreground">
                            {money(prod.retailPrice || prod.costPrice)}
                          </span>
                          <Badge
                            variant={stock <= 0 ? "destructive-soft" : stock <= 5 ? "warning" : "neutral"}
                            className="tabular px-1.5 text-[11px]"
                          >
                            {stock <= 0 ? "Out" : `${stock} in stock`}
                          </Badge>
                        </div>
                        <span className="pointer-events-none absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* RIGHT: CART & WORKFLOW ACTIONS */}
          <div
            id="pos-cart"
            className={`flex min-h-[480px] flex-col border-t bg-surface lg:min-h-0 lg:border-l lg:border-t-0 flex-1 overflow-y-auto ${
              mobileSalesView !== "cart" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* CART HEADER */}
            <div className="flex flex-col gap-2.5 border-b px-4 py-3 bg-surface shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileSalesView("catalog")}
                    className="lg:hidden h-8 px-2 text-xs gap-1 -ml-1 text-muted-foreground shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Products
                  </Button>
                  <span className="whitespace-nowrap text-sm font-semibold truncate">
                    {activeCart?.cartNumber ? `Ticket #${activeCart.cartNumber}` : "Current order"}
                  </span>
                  {cartItems.length > 0 && (
                    <Badge variant="brand" className="tabular shrink-0 text-xs">
                      {cartCount} {cartCount === 1 ? "item" : "items"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-2 px-2.5 py-1 rounded-md border border-border/60 shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="hidden sm:inline shrink-0 font-medium">Salesperson:</span>
                  <span className="font-semibold text-foreground truncate max-w-[100px] sm:max-w-[120px]" title={cashierName}>
                    {cashierName}
                  </span>
                </div>
              </div>

              {/* CUSTOMER SELECTOR */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="pos-customer-select" className="sr-only">
                    Select Customer
                  </Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={(val) => handleCustomerSelect(val)}
                    disabled={isCartLocked}
                  >
                    <SelectTrigger id="pos-customer-select" className="h-8 text-[13px] w-full">
                      <SelectValue placeholder="Walk-in Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walkin">Walk-in Customer</SelectItem>
                      {customers.map((c: CustomerItem) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.customerCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 px-2.5 text-xs"
                  onClick={() => {
                    resetAddCustomerForm();
                    setShowAddCustomerModal(true);
                  }}
                  disabled={isCartLocked}
                >
                  + New Customer
                </Button>
              </div>

              {/* LOCKED CART STATUS BANNER */}
              {isCartLocked && activeCart && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium truncate">
                      Submitted ({activeCart.workflowStatus?.replace(/_/g, " ")}) — Order locked
                    </span>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    className="shrink-0 h-6 text-[11px] border-amber-500/40 bg-surface hover:bg-amber-500/20"
                    onClick={handleStartNewCart}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Start Next Cart
                  </Button>
                </div>
              )}
            </div>

            {/* CART ITEMS LIST */}
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {cartItems.length === 0 ? (
                <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-surface-2 text-muted-foreground">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold">Cart is empty</p>
                  <p className="text-[13px] text-muted-foreground">
                    Scan a barcode or tap a product to add it.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.2 }}
                      className="group flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-surface-2/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{item.product?.name}</div>
                        <div className="tabular truncate text-xs text-muted-foreground">
                          {item.variant ? `${item.variant.name} · ` : ""}
                          {money(item.unitPrice)} each
                        </div>
                      </div>

                      {/* Quantity Controls (Disabled when locked) */}
                      <div className="flex items-center rounded-md border bg-surface shadow-xs">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={isCartLocked}
                          className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() =>
                            item.quantity > 1
                              ? updateItemMutation.mutate({
                                  cartId: activeCart!.id,
                                  itemId: item.id,
                                  dto: { quantity: item.quantity - 1 },
                                })
                              : removeItemMutation.mutate({
                                  cartId: activeCart!.id,
                                  itemId: item.id,
                                })
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="tabular w-7 text-center text-[13px] font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={isCartLocked}
                          className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() =>
                            updateItemMutation.mutate({
                              cartId: activeCart!.id,
                              itemId: item.id,
                              dto: { quantity: item.quantity + 1 },
                            })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="tabular min-w-20 shrink-0 text-right text-[13px] font-semibold">
                        {money(item.totalAmount)}
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${item.product?.name ?? "item"}`}
                        disabled={isCartLocked}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() =>
                          removeItemMutation.mutate({ cartId: activeCart!.id, itemId: item.id })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* CART FOOTER & ACTIONS */}
            <div className="space-y-3 border-t bg-surface-2/40 px-4 py-4">
              <dl className="tabular space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{money(activeCart?.subtotalAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="text-destructive">-{money(activeCart?.discountAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd>{money(activeCart?.taxAmount)}</dd>
                </div>
              </dl>

              <div className="flex items-end justify-between border-t pt-3">
                <span className="text-sm font-medium">Total</span>
                <span className="tabular font-display text-2xl font-semibold tracking-tight">
                  {money(activeCart?.totalAmount)}
                </span>
              </div>

              {/* ACTION BUTTONS: DRAFT VS LOCKED */}
              {isCartLocked ? (
                <Button
                  size="lg"
                  className="h-12 w-full text-base font-semibold"
                  onClick={handleStartNewCart}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Start Next Cart
                </Button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => activeCartId && holdCartMutation.mutate({ cartId: activeCartId })}
                      disabled={!activeCart?.items.length || holdCartMutation.isPending}
                    >
                      <PauseCircle className="mr-1.5 h-4 w-4" />
                      Hold
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => activeCartId && clearCartMutation.mutate(activeCartId)}
                      disabled={!activeCart?.items.length}
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {/* Sales Register Action: Send to Billing Desk */}
                  <Button
                    size="lg"
                    className="h-12 w-full text-base font-semibold"
                    onClick={() => setShowSendToBillingModal(true)}
                    disabled={!activeCart?.items.length || sendToBillingMutation.isPending}
                  >
                    {sendToBillingMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Ticket…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Billing Desk ({money(activeCart?.totalAmount)})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE: STICKY BOTTOM CART BAR */}
        {cartItems.length > 0 && mobileSalesView === "catalog" && (
          <div className="sticky bottom-0 z-10 border-t bg-background/95 p-2.5 sm:p-3 backdrop-blur lg:hidden pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <Button
              size="lg"
              className="w-full min-h-[48px] h-12 text-sm font-semibold justify-between shadow-lg"
              onClick={() => setMobileSalesView("cart")}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>View Cart ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
              </div>
              <span className="font-mono font-bold text-base">{money(activeCart?.totalAmount)} →</span>
            </Button>
          </div>
        )}

        {/* SEND TO BILLING DIALOG */}
        <Dialog open={showSendToBillingModal} onOpenChange={setShowSendToBillingModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Order to Billing Desk</DialogTitle>
              <DialogDescription>
                Submit this cart to the billing queue. An assigned ticket number will be generated
                for customer tracking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-surface-2/60 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items in cart:</span>
                  <span className="font-medium">{cartCount} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">
                    {selectedCustomerId === "walkin"
                      ? "Walk-in Customer"
                      : customers.find((c) => c.id === selectedCustomerId)?.name ||
                        "Walk-in Customer"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-semibold text-base">
                  <span>Estimated Total:</span>
                  <span className="text-foreground">{money(activeCart?.totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="send-to-billing-notes">Salesperson remarks (optional)</Label>
                <Input
                  id="send-to-billing-notes"
                  placeholder="e.g., Requested gift packing, corporate tax invoice"
                  value={sendToBillingNotes}
                  onChange={(e) => setSendToBillingNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowSendToBillingModal(false)}
                disabled={sendToBillingMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSendToBilling}
                disabled={sendToBillingMutation.isPending}
              >
                {sendToBillingMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Confirm & Send to Billing
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TICKET CONFIRMATION MODAL */}
        <Dialog
          open={Boolean(ticketConfirmation)}
          onOpenChange={(open) => {
            if (!open) setTicketConfirmation(null);
          }}
        >
          <DialogContent className="sm:max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl">Ticket Queued for Billing</DialogTitle>
              <DialogDescription>
                The cart has been successfully transferred to the Billing Desk queue.
              </DialogDescription>
            </DialogHeader>

            <div className="my-2 rounded-xl border bg-surface-2/60 p-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Ticket Number
                </span>
                <span className="font-mono text-xl font-bold text-primary">
                  {ticketConfirmation?.ticketNumber}
                </span>
              </div>

              <div className="space-y-1.5 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">
                    {ticketConfirmation?.customerName || "Walk-in Customer"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line items</span>
                  <span className="font-medium">{ticketConfirmation?.itemCount} items</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="text-foreground">
                    {money(ticketConfirmation?.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground text-left">
              <Receipt className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Please guide customer to the Billing Counter with Ticket #
                <strong className="text-foreground font-mono">
                  {ticketConfirmation?.ticketNumber}
                </strong>
                .
              </span>
            </div>

            <DialogFooter className="mt-4 sm:justify-center">
              <Button size="lg" className="w-full sm:w-auto min-w-[200px]" onClick={handleStartNewCart}>
                <Plus className="mr-2 h-4 w-4" />
                Start Next Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>




        {/* CLOSE REGISTER MODAL */}
        <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Close register</DialogTitle>
              <DialogDescription>
                Enter the counted cash to reconcile and close this terminal session.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1 text-sm">
              <div className="space-y-1.5">
                <Label>Counted cash ({currencySymbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="tabular h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Closing notes</Label>
                <Input
                  placeholder="End of shift remarks…"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCloseModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (activeSession) {
                    closeSessionMutation.mutate(
                      {
                        id: activeSession.id,
                        dto: {
                          closingCash: Number(closingCash),
                          notes: closeNotes,
                        },
                      },
                      {
                        onSuccess: () => setShowCloseModal(false),
                      },
                    );
                  }
                }}
                disabled={closeSessionMutation.isPending}
              >
                {closeSessionMutation.isPending ? "Closing…" : "Close register"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QUICK ADD CUSTOMER DIALOG */}
        <Dialog
          open={showAddCustomerModal}
          onOpenChange={(open) => {
            setShowAddCustomerModal(open);
            if (!open) {
              resetAddCustomerForm();
            }
          }}
        >
          <DialogContent className="max-h-[90vh] w-full sm:max-w-[620px] p-0 flex flex-col overflow-hidden gap-0">
            <DialogHeader className="p-6 pb-4 border-b shrink-0 text-left">
              <DialogTitle>Quick add customer</DialogTitle>
              <DialogDescription>
                Create a new customer profile and immediately select them for this POS sale.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleQuickAddCustomer} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {createCustomerError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive-soft p-3 text-[13px] text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{createCustomerError}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pos-quick-customer-name">
                      Customer Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pos-quick-customer-name"
                      placeholder="Acme Corporation"
                      value={newCustomerName}
                      onChange={(e) => {
                        setNewCustomerName(e.target.value);
                        if (createCustomerError) setCreateCustomerError(null);
                      }}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pos-quick-customer-code">
                      Customer Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pos-quick-customer-code"
                      placeholder="e.g. CUST-001"
                      value={newCustomerCode}
                      onChange={(e) => setNewCustomerCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pos-quick-customer-email">Email</Label>
                    <Input
                      id="pos-quick-customer-email"
                      type="email"
                      placeholder="customer@example.com"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pos-quick-customer-phone">Phone Number</Label>
                    <Input
                      id="pos-quick-customer-phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pos-quick-customer-credit-limit">Credit Limit ({currencySymbol})</Label>
                    <Input
                      id="pos-quick-customer-credit-limit"
                      type="number"
                      min="0"
                      placeholder="50000"
                      value={newCustomerCreditLimit}
                      onChange={(e) => setNewCustomerCreditLimit(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pos-quick-customer-payment-terms">Payment Terms</Label>
                    <Input
                      id="pos-quick-customer-payment-terms"
                      placeholder="NET30"
                      value={newCustomerPaymentTerms}
                      onChange={(e) => setNewCustomerPaymentTerms(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pos-quick-customer-tax-id">Tax ID / GSTIN</Label>
                    <Input
                      id="pos-quick-customer-tax-id"
                      placeholder="29ABCDE1234F1Z5"
                      value={newCustomerTaxId}
                      onChange={(e) => setNewCustomerTaxId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pos-quick-customer-city">City</Label>
                    <Input
                      id="pos-quick-customer-city"
                      placeholder="Bengaluru"
                      value={newCustomerCity}
                      onChange={(e) => setNewCustomerCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="pos-quick-cashier-name">
                      Staff / Cashier Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pos-quick-cashier-name"
                      placeholder="Enter staff name"
                      value={manualCashierName}
                      onChange={(e) => {
                        setManualCashierName(e.target.value);
                        if (createCustomerError) setCreateCustomerError(null);
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 sm:px-6 border-t bg-popover shrink-0 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    resetAddCustomerForm();
                  }}
                  disabled={createCustomerMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !newCustomerName.trim() ||
                    !manualCashierName.trim() ||
                    createCustomerMutation.isPending
                  }
                >
                  {createCustomerMutation.isPending ? (
                    <>
                      <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                      Saving…
                    </>
                  ) : (
                    "Save & Select Customer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Layers,
  Package,
  Receipt,
  ScanBarcode,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

export function LandingEcosystem() {
  const [activeStep, setActiveStep] = useState(3); // Default to POS Sales

  const workflowSteps = [
    {
      id: "products",
      number: "01",
      name: "Products",
      icon: Package,
      short: "Catalog & Pricing",
      action: "Define SKU, barcodes, categories, and purchase vs. retail pricing.",
      automation:
        "Newly created products immediately sync to POS registers and vendor RFQ catalogs.",
      cascade: [
        "Barcode generated for thermal sticker printing",
        "Assigned to category margins and tax schedules",
        "Available for immediate inclusion in purchase orders",
      ],
    },
    {
      id: "purchasing",
      number: "02",
      name: "Purchasing",
      icon: ShoppingCart,
      short: "Orders & Suppliers",
      action: "Generate purchase orders and track shipments from global or local vendors.",
      automation:
        "Receiving goods automatically credits stock in the target warehouse without manual entry.",
      cascade: [
        "Supplier price book saved for historical comparisons",
        "Landed costs distributed across line item cost basis",
        "Accounts payable invoice scheduled according to credit terms",
      ],
    },
    {
      id: "inventory",
      number: "03",
      name: "Inventory",
      icon: Boxes,
      short: "Live Warehouses",
      action: "Track on-hand, reserved, and available quantities across all locations.",
      automation:
        "Every receipt, sale, or transfer order instantly updates available stock counts.",
      cascade: [
        "Multi-warehouse stock reservation prevents overselling",
        "Batch and serial numbers logged for audit traceability",
        "Automated alerts trigger when reaching safety stock thresholds",
      ],
    },
    {
      id: "pos",
      number: "04",
      name: "POS Sales",
      icon: ScanBarcode,
      short: "Billing & Cashier",
      action: "Scan barcodes or tap touch tiles to ring up sales and accept split payments.",
      automation:
        "Completing a sale automatically reduces warehouse stock and generates general ledger journal entries.",
      cascade: [
        "Instant deduction of inventory in the active register's warehouse",
        "Thermal customer receipt printed with breakdown of taxes",
        "Tender posted to cash, card, or UPI clearing accounts",
      ],
    },
    {
      id: "customers",
      number: "05",
      name: "Customers",
      icon: Users,
      short: "CRM & Credit",
      action: "Maintain unified customer profiles, credit limits, and sales history.",
      automation:
        "Every transaction updates the customer's lifetime value and outstanding account balance.",
      cascade: [
        "Credit limit checks enforced automatically at checkout",
        "Accounts receivable aging schedule updated (30/60/90 days)",
        "Purchase history logged for personalized loyalty and support",
      ],
    },
    {
      id: "accounting",
      number: "06",
      name: "Accounting",
      icon: CircleDollarSign,
      short: "Double-Entry Ledger",
      action: "Every operational event generates a balanced debit and credit journal entry.",
      automation:
        "Financial statements, P&L, balance sheets, and tax reports are permanently in sync.",
      cascade: [
        "Zero manual end-of-day bookkeeping reconciliations required",
        "Revenue, cost of goods sold (COGS), and sales tax posted live",
        "Audit-ready general ledger adhering to standard accounting principles",
      ],
    },
    {
      id: "analytics",
      number: "07",
      name: "Analytics",
      icon: BarChart3,
      short: "Insights & Strategy",
      action: "Consolidated executive dashboards present real-time business health.",
      automation:
        "Real-time margins, branch leaderboards, and sales velocity drive strategic growth.",
      cascade: [
        "Gross profit margins computed by category and SKU live",
        "Branch performance comparisons reveal top and underperforming stores",
        "One-click export to Excel and CSV for board or investor presentations",
      ],
    },
  ];

  const current = workflowSteps[activeStep]!;

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-surface-2/40 border-y border-border/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Workflow className="w-3.5 h-3.5" />
            Connected Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            One Connected <span className="text-gradient-brand">Business Ecosystem</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            See how business information flows continuously without manual re-typing. Click any
            stage below to inspect how data cascades automatically through the operating system.
          </p>
        </div>

        {/* The 7 Steps Interactive Pipeline */}
        <div className="space-y-8">
          {/* Step Pill Buttons Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isActive
                      ? "border-primary bg-surface shadow-md ring-2 ring-primary/20"
                      : "border-border/60 bg-surface/60 hover:bg-surface hover:border-border text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {step.number}
                    </span>
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        isActive ? "text-foreground" : "text-foreground/80"
                      }`}
                    >
                      {step.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{step.short}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Workflow Diagram Banner */}
          <div className="hidden lg:flex items-center justify-between px-6 py-3 rounded-xl bg-surface border border-border/60 text-xs font-mono text-muted-foreground">
            <span className={activeStep === 0 ? "text-primary font-bold" : ""}>Products</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className={activeStep === 1 ? "text-primary font-bold" : ""}>Purchasing</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className={activeStep === 2 ? "text-primary font-bold" : ""}>Inventory</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className={activeStep === 3 ? "text-primary font-bold" : ""}>POS Sales</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className={activeStep === 4 ? "text-primary font-bold" : ""}>Customers</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className={activeStep === 5 ? "text-primary font-bold" : ""}>Accounting</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className={activeStep === 6 ? "text-primary font-bold" : ""}>Analytics</span>
          </div>

          {/* Active Stage Deep-Dive Card */}
          <div className="rounded-2xl border border-border/80 bg-surface shadow-lg p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Stage Details */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <current.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-primary font-semibold uppercase tracking-wider">
                      Stage {current.number} in Flow
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                      {current.name} &bull; {current.short}
                    </h3>
                  </div>
                </div>

                <p className="text-base text-foreground leading-relaxed">{current.action}</p>

                <div className="p-4 rounded-xl bg-surface-2/80 border border-border/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Zap className="w-4 h-4" />
                    Automated Platform Orchestration
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {current.automation}
                  </p>
                </div>
              </div>

              {/* Right Column: Cascading Automated Actions */}
              <div className="lg:col-span-6 space-y-3">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Automated Downstream Actions
                </div>
                <div className="space-y-2.5">
                  {current.cascade.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-2 border border-border/60 text-xs"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="text-foreground leading-relaxed font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/40">
                  <span>Data stored in PostgreSQL with tenant isolation</span>
                  <span className="font-mono text-primary font-semibold">Zero sync lag</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

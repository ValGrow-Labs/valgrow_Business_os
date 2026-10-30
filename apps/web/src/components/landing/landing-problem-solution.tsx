import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Database,
  FileSpreadsheet,
  Layers,
  LineChart,
  Receipt,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  XCircle,
  Zap,
} from "lucide-react";

export function LandingProblemSolution() {
  const comparisonItems = [
    {
      title: "Disconnected Business Operations",
      problem: {
        tag: "The Fragmented Tool Trap",
        description:
          "5+ separate apps for billing, stock, purchasing, and bookkeeping. Staff wastes hours exporting CSVs and copying numbers back and forth.",
        impact: "Data duplication, human errors, and constant sync failures.",
      },
      solution: {
        tag: "ValGrow Unified OS",
        description:
          "A single, centralized business operating system. Every branch, counter, and warehouse runs on one unified platform with zero third-party sync lag.",
        benefit: "One login, single source of truth, and seamless departmental coordination.",
      },
    },
    {
      title: "Manual & Stale Inventory Tracking",
      problem: {
        tag: "Spreadsheet Guesswork",
        description:
          "Stock levels updated once a week in spreadsheets. Cashiers accidentally sell products that are already out of stock or reserved for wholesale orders.",
        impact: "Customer complaints, lost revenue, and capital trapped in dead stock.",
      },
      solution: {
        tag: "Real-Time Multi-Warehouse Inventory",
        description:
          "Every POS checkout or delivery receipt automatically updates stock in real time. Accurate on-hand, reserved, and available quantities across all locations.",
        benefit: "Automated low-stock reorder triggers, batch tracking, and zero overselling.",
      },
    },
    {
      title: "Difficult Sales & Cashier Tracking",
      problem: {
        tag: "Isolated Counter Tills",
        description:
          "Stand-alone till terminals disconnected from accounting. Cashiers take hours at the end of each shift manually balancing cash, UPI, and card receipts.",
        impact: "Till shortages, slow checkouts during rush hours, and delayed ledger postings.",
      },
      solution: {
        tag: "Hardware-Ready Smart POS",
        description:
          "Lightning-fast point of sale with USB barcode scanner, thermal printer, cash drawer tracking, and split payments (Cash, Card, UPI) that post straight to accounts.",
        benefit: "Rapid checkout lanes, automated shift closing, and instant daily sales clarity.",
      },
    },
    {
      title: "Complicated Purchasing & Vendor Discrepancies",
      problem: {
        tag: "Informal Purchase Orders",
        description:
          "Orders placed informally over WhatsApp or calls. Deliveries arrive without clear verification, and vendor invoice surprises appear weeks later.",
        impact: "Overbilling by suppliers, unverified deliveries, and missing landed costs.",
      },
      solution: {
        tag: "Structured Procure-to-Pay (P2P)",
        description:
          "Formal Purchase Orders (PO), Goods Receipts (GRN) that instantly add stock upon delivery, and 3-way invoice matching with automated accounts payable.",
        benefit: "Supplier price history tracking, landed cost calculation, and accurate payables.",
      },
    },
    {
      title: "Lack of Real-Time Business Visibility",
      problem: {
        tag: "Waiting for Month-End Reports",
        description:
          "Business owners only discover their actual profit, margins, and branch losses weeks after the month closes when an external accountant files books.",
        impact: "Inability to respond quickly to margin drops or underperforming stores.",
      },
      solution: {
        tag: "Live Double-Entry Ledgers & Analytics",
        description:
          "Executive dashboards and automated double-entry accounting records every transaction the moment it happens. Instant P&L, balance sheets, and tax reports.",
        benefit: "Make strategic inventory and pricing decisions backed by live numbers.",
      },
    },
  ];

  return (
    <section id="solutions" className="py-20 md:py-28 bg-surface-2/40 border-y border-border/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Zap className="w-3.5 h-3.5" />
            Why Businesses Switch
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Your Business. Too Many Tools.{" "}
            <span className="text-gradient-brand">One Solution.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Stop stitching together disconnected software. See how ValGrow Business OS replaces the
            chaos of multiple tools with one unified, reliable operating foundation.
          </p>
        </div>

        {/* Comparison Cards Grid */}
        <div className="mt-14 space-y-6">
          {comparisonItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/80 bg-surface shadow-xs overflow-hidden transition-all hover:shadow-md"
            >
              {/* Category Title Bar */}
              <div className="px-6 py-3.5 bg-surface-2/60 border-b border-border/60 flex items-center justify-between">
                <span className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold font-mono">
                    {idx + 1}
                  </span>
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                  ValGrow vs Traditional Software
                </span>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60">
                {/* The Old / Problem Way */}
                <div className="p-6 sm:p-7 space-y-3 bg-destructive-soft/10">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-destructive">
                      <XCircle className="w-4 h-4" />
                      {item.problem.tag}
                    </span>
                    <span className="text-[11px] text-muted-foreground">The Costly Way</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed font-normal">
                    {item.problem.description}
                  </p>
                  <div className="pt-2 text-xs text-destructive/90 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cost: {item.problem.impact}</span>
                  </div>
                </div>

                {/* The ValGrow Solution */}
                <div className="p-6 sm:p-7 space-y-3 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      {item.solution.tag}
                    </span>
                    <span className="text-[11px] text-success font-medium">Unified Advantage</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed font-normal">
                    {item.solution.description}
                  </p>
                  <div className="pt-2 text-xs text-success flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Result: {item.solution.benefit}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

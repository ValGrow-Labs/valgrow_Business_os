import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Layers,
  Receipt,
  ScanBarcode,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingUseCasesProps {
  onGetStartedClick: () => void;
}

export function LandingUseCases({ onGetStartedClick }: LandingUseCasesProps) {
  const useCases = [
    {
      id: "retail",
      icon: ShoppingBag,
      title: "Retail Stores & Boutiques",
      badge: "High-Throughput POS",
      headline: "Rapid Checkout Lanes & Barcode Scanning",
      description:
        "Keep checkout lines moving during peak hours. Plug in any standard USB HID barcode scanner, print thermal receipts in seconds, and accept Cash, Cards, and UPI seamlessly.",
      highlights: [
        "Touchscreen and barcode cashier interfaces",
        "Split-tender payments and instant digital receipts",
        "Live stock deduction prevents selling unavailable items",
        "Automated cash drawer reconciliation at shift close",
      ],
      metric: "Sub-second barcode scan & checkout velocity",
    },
    {
      id: "supermarkets",
      icon: Store,
      title: "Supermarkets & Grocery",
      badge: "Batch & Expiry Control",
      headline: "High Volume & Perishable Goods Tracking",
      description:
        "Manage thousands of SKUs across multiple checkout lanes with ease. Track perishable batch numbers and expiry dates to eliminate wastage and maintain food safety standards.",
      highlights: [
        "Perishable batch tracking with early expiry alerts",
        "Rapid item search by barcode, name, or quick-category keys",
        "Multiple concurrent checkout registers under one store",
        "Automatic unit conversions and weight-based pricing",
      ],
      metric: "Zero expired stock write-off surprises",
    },
    {
      id: "wholesale",
      icon: Truck,
      title: "Wholesale & Distribution",
      badge: "B2B Credit & P2P",
      headline: "Bulk Orders, Credit Limits & Landed Costs",
      description:
        "Manage high-volume purchase orders, supplier shipments, and B2B customer credit terms. Enforce customer credit limits at quotation and automatically calculate true landed product costs.",
      highlights: [
        "Custom tiered pricing matrices for wholesale accounts",
        "Customer credit limits with aging analysis (30/60/90 days)",
        "Goods Receipts (GRN) with 3-way supplier bill matching",
        "Multi-warehouse order fulfillment and delivery notes",
      ],
      metric: "100% accurate accounts receivable enforcement",
    },
    {
      id: "multibranch",
      icon: Building2,
      title: "Multi-Branch Enterprises",
      badge: "Central Governance",
      headline: "Unified HQ Oversight with Isolated Registers",
      description:
        "Scale from one store to a regional retail chain. Centralize product catalogs, vendor contracts, and consolidated financial reports while keeping localized register transactions secure.",
      highlights: [
        "Centralized master catalog with branch-specific price overrides",
        "Role-Based Access Control (RBAC) isolating store staff to their branch",
        "Inter-branch stock transfer orders with transit status tracking",
        "Consolidated P&L, balance sheets, and branch leaderboards",
      ],
      metric: "Real-time visibility across all locations in one view",
    },
    {
      id: "sme",
      icon: Zap,
      title: "Growing SMEs",
      badge: "Complete Business OS",
      headline: "Replace 5 Disconnected Software Subscriptions",
      description:
        "Eliminate the high cost and maintenance headache of paying for separate POS, inventory, CRM, and accounting software. ValGrow gives you the entire stack in one predictable platform.",
      highlights: [
        "Save up to 60% on SaaS licensing costs by consolidating tools",
        "Eliminate manual CSV data copying between departments",
        "Audit-ready double-entry ledger without extra accounting software",
        "Fast onboarding with intuitive, modern web interfaces",
      ],
      metric: "Save 15+ hours per week of manual data entry",
    },
  ];

  return (
    <section id="solutions" className="py-20 md:py-32 bg-surface-2/30 border-y border-border/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Store className="w-3.5 h-3.5" />
            Industry Tailored
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Built for <span className="text-gradient-brand">Growing Businesses</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Whether you run a high-traffic boutique, a busy supermarket, or a distributed wholesale
            network, ValGrow Business OS adapts precisely to your commercial operations.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((uc, idx) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.id}
                className={`p-6 sm:p-7 rounded-2xl border border-border/80 bg-surface shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-primary/40 ${
                  idx === 4 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 border border-border/60 text-muted-foreground">
                      {uc.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground">{uc.title}</h3>
                    <div className="text-xs font-semibold text-primary mt-0.5">{uc.headline}</div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {uc.description}
                  </p>

                  <div className="pt-2 border-t border-border/40 space-y-2">
                    {uc.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="font-semibold text-success flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {uc.metric}
                  </span>
                  <button
                    type="button"
                    onClick={onGetStartedClick}
                    className="text-primary hover:underline font-medium inline-flex items-center"
                  >
                    Learn more <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

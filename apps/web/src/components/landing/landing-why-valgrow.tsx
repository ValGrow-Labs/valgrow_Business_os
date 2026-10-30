import {
  CheckCircle2,
  Database,
  GitBranch,
  Layers,
  LineChart,
  Lock,
  RefreshCw,
  Scale,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function LandingWhyValgrow() {
  const valuePillars = [
    {
      icon: Database,
      title: "One Centralized Business Platform",
      description:
        "No more paying for and configuring 5-7 different software subscriptions. All your business operations—from POS tills and multi-warehouse inventory to purchasing, customers, and accounting—run inside a single unified system.",
      badge: "Unified Relational Data",
    },
    {
      icon: RefreshCw,
      title: "Connected Operations with Zero Sync Delay",
      description:
        "Every event cascades across your business instantaneously. Sell an item at the counter, and your inventory decrements in the specific branch warehouse, customer history updates, and accounting journals post live.",
      badge: "Real-Time Ledger",
    },
    {
      icon: Lock,
      title: "Enterprise Role-Based Access Control (RBAC)",
      description:
        "Granular security controls ensure users only access the screens and data they need. Distinct permission scopes for Cashier, Billing Desk, Warehouse Keeper, Store Manager, and Corporate Owner.",
      badge: "Audit & Policy Engine",
    },
    {
      icon: GitBranch,
      title: "True Multi-Branch & Multi-Warehouse Architecture",
      description:
        "Designed from the ground up for scalable multi-location enterprises. Headquarters retains full consolidated visibility while individual branches operate with localized registers and routing.",
      badge: "Multi-Tenant Scalability",
    },
    {
      icon: Scale,
      title: "Integrated Double-Entry Accounting Precision",
      description:
        "Traditional software requires manual data re-entry into an accounting package at month end. ValGrow automatically enforces balanced double-entry accounting rules on every commercial transaction.",
      badge: "Audit-Ready Ledgers",
    },
    {
      icon: LineChart,
      title: "Instant Business Performance Visibility",
      description:
        "Make strategic decisions with confidence. Executive dashboards reveal gross profit margins by SKU and category, sales velocity, cashier performance, and dead stock in real time.",
      badge: "Live BI Dashboards",
    },
  ];

  return (
    <section id="about" className="py-20 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Core Value Proposition
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Why Forward-Thinking Businesses Choose{" "}
            <span className="text-gradient-brand">ValGrow</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Engineered to provide the robust stability, speed, and real-time clarity required to run
            serious commercial operations without compromise.
          </p>
        </div>

        {/* 6 Value Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {valuePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl border border-border/80 bg-surface shadow-xs space-y-4 transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-2 border border-border/60 text-muted-foreground">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center gap-1.5 text-xs text-primary font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>Production-Ready Implementation</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Stack Architecture Footnote */}
        <div className="p-6 rounded-2xl border border-border/80 bg-surface-2/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Technical Foundation:</span>
            <span>React 19 &bull; Vite &bull; TanStack Start &bull; Tailwind CSS v4 &bull; NestJS &bull; PostgreSQL 16</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-success font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              99.99% Core API Availability
            </span>
            <span className="text-border">|</span>
            <span>150+ Currencies Supported</span>
          </div>
        </div>
      </div>
    </section>
  );
}

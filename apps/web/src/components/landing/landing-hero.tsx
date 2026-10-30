import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Compass,
  Layers,
  Package,
  Receipt,
  ScanBarcode,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

interface LandingHeroProps {
  onGetStartedClick: () => void;
}

export function LandingHero({ onGetStartedClick }: LandingHeroProps) {
  const [activeMetricTab, setActiveMetricTab] = useState<"revenue" | "orders" | "margin">("revenue");

  const scrollToExplore = () => {
    const target = document.querySelector("#features");
    if (target) {
      const topOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background radial gradient and subtle grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
      >
        <div className="h-[600px] w-[800px] rounded-full bg-gradient-to-tr from-primary/15 via-primary/5 to-transparent blur-3xl opacity-70 dark:opacity-40" />
        <div className="absolute top-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-brand-glow/10 blur-3xl opacity-50 dark:opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-border/80 shadow-xs text-xs font-medium text-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-primary">ValGrow Business OS</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">The Complete Operating System</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Run Your Entire Business.{" "}
            <span className="text-gradient-brand block sm:inline">From One Platform.</span>
          </h1>

          {/* Supporting Headline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Manage operations, inventory, sales, purchasing, customers, and business performance
            with one intelligent Business Operating System.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              size="lg"
              onClick={onGetStartedClick}
              className="w-full sm:w-auto h-12 px-7 text-base font-medium shadow-md hover:shadow-lg transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={scrollToExplore}
              className="w-full sm:w-auto h-12 px-7 text-base font-medium bg-background/60 hover:bg-surface-2 transition-all"
            >
              Explore Platform
              <ChevronRight className="w-4 h-4 ml-1.5 text-muted-foreground" />
            </Button>
          </div>

          {/* Core Trust Pillars */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/50 border border-border/40 text-xs">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">Real-Time Ledger</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/50 border border-border/40 text-xs">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">Multi-Branch & Warehouses</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/50 border border-border/40 text-xs">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">Hardware-Ready POS</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/50 border border-border/40 text-xs">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">Zero Sync Delays</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 PREVIEW: High-Fidelity Product Dashboard Preview */}
        <div className="mt-14 sm:mt-18 relative max-w-6xl mx-auto">
          {/* Subtle glow border around preview */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-brand-glow/20 to-primary/30 opacity-70 blur-xl -z-10" />

          {/* Browser / Application Frame */}
          <div className="rounded-xl border border-border/80 bg-card shadow-2xl overflow-hidden">
            {/* Top Window Titlebar */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-2/80 border-b border-border/60 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-destructive/60 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-warning/60 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-success/60 inline-block" />
                </div>
                <div className="hidden sm:flex items-center gap-2 ml-3 px-2 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-mono text-[11px]">
                  <span>valgrow://holdings.hq/overview</span>
                </div>
              </div>

              {/* Organization & Branch Context */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium">
                  <Building2 className="w-3 h-3" />
                  <span>ValGrow Holdings · HQ Bengaluru</span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-success font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Ledger Live
                </span>
              </div>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background/50">
              {/* Header inside dashboard */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium text-primary">Live Operations Snapshot</div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Business Overview & Performance
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Consolidated metrics across 3 warehouses and 6 POS counters.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-surface-2 border border-border/80 text-muted-foreground font-mono">
                    Currency: USD ($)
                  </span>
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                    <Link to="/login">Launch Workspace</Link>
                  </Button>
                </div>
              </div>

              {/* 4 Metric KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Metric 1: Total Sales */}
                <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Sales (30 Days)</span>
                    <CircleDollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                    $128,450.00
                  </div>
                  <div className="flex items-center gap-1 text-xs text-success font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+18.4% vs last period</span>
                  </div>
                </div>

                {/* Metric 2: Today's Orders & POS */}
                <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Today's Counter POS</span>
                    <ShoppingBag className="w-4 h-4 text-info" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                    $14,280.50
                  </div>
                  <div className="text-xs text-muted-foreground">
                    184 completed transactions
                  </div>
                </div>

                {/* Metric 3: Inventory Value */}
                <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Live Stock Value</span>
                    <Boxes className="w-4 h-4 text-warning" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                    $482,100.00
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-foreground font-semibold">1,420</span> SKUs across 3 hubs
                  </div>
                </div>

                {/* Metric 4: Gross Margin */}
                <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Operating Margin</span>
                    <BarChart3 className="w-4 h-4 text-success" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                    34.8%
                  </div>
                  <div className="text-xs text-success font-medium">
                    +2.6% above Q4 forecast
                  </div>
                </div>
              </div>

              {/* Main Visual: Performance Chart & Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Visual Chart Card */}
                <div className="lg:col-span-2 p-5 rounded-xl bg-surface border border-border/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Revenue & Fulfillment Velocity
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Daily sales volume and double-entry posted revenue
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-2 border border-border/60 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveMetricTab("revenue")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          activeMetricTab === "revenue"
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Revenue
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMetricTab("orders")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          activeMetricTab === "orders"
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        POS Orders
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMetricTab("margin")}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          activeMetricTab === "margin"
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Margin %
                      </button>
                    </div>
                  </div>

                  {/* SVG Chart Visualization */}
                  <div className="h-52 sm:h-64 w-full relative pt-4">
                    <svg
                      viewBox="0 0 500 160"
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />
                      <line x1="0" y1="60" x2="500" y2="60" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />
                      <line x1="0" y1="140" x2="500" y2="140" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />

                      {/* Area Fill */}
                      <path
                        d="M0,130 C60,115 110,135 160,95 C210,65 260,90 310,50 C360,25 410,55 500,20 L500,150 L0,150 Z"
                        fill="url(#heroChartGrad)"
                      />

                      {/* Curve Stroke */}
                      <path
                        d="M0,130 C60,115 110,135 160,95 C210,65 260,90 310,50 C360,25 410,55 500,20"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Target dashed line */}
                      <path
                        d="M0,100 C100,95 200,85 300,75 C400,65 450,60 500,55"
                        fill="none"
                        stroke="var(--color-muted-foreground)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity="0.7"
                      />

                      {/* Highlight Dots */}
                      <circle cx="310" cy="50" r="4.5" fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth="2" />
                      <circle cx="500" cy="20" r="5" fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth="2" />
                    </svg>

                    {/* X Axis Labels */}
                    <div className="flex justify-between text-[11px] text-muted-foreground font-mono pt-2 border-t border-border/40">
                      <span>Oct 01</span>
                      <span>Oct 08</span>
                      <span>Oct 15</span>
                      <span>Oct 22</span>
                      <span>Today (Live)</span>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions & Stock Status */}
                <div className="p-5 rounded-xl bg-surface border border-border/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        Recent Sales & Movements
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-soft text-success font-semibold">
                        Live Feed
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          sku: "POS-INV #9842",
                          customer: "Apex Supermarket",
                          amount: "$1,450.00",
                          method: "Card / POS",
                          time: "2 mins ago",
                          status: "Completed",
                        },
                        {
                          sku: "POS-INV #9841",
                          customer: "Walk-in Customer",
                          amount: "$84.20",
                          method: "UPI QR",
                          time: "7 mins ago",
                          status: "Completed",
                        },
                        {
                          sku: "GRN-PO #4021",
                          customer: "Logistics Hub North",
                          amount: "+250 Units",
                          method: "Goods Receipt",
                          time: "18 mins ago",
                          status: "Stock Updated",
                        },
                        {
                          sku: "SO-ORD #8310",
                          customer: "Global Tech Corp",
                          amount: "$4,290.00",
                          method: "Bank Transfer",
                          time: "42 mins ago",
                          status: "Dispatched",
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2/60 border border-border/40 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-medium text-foreground">{item.customer}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                              <span>{item.sku}</span>
                              <span>·</span>
                              <span>{item.method}</span>
                            </div>
                          </div>
                          <div className="text-right space-y-0.5">
                            <div className="font-semibold text-foreground font-mono">{item.amount}</div>
                            <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-success/15 text-success font-medium">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Double-entry ledger auto-posted</span>
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      View POS Terminal →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

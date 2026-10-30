import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Barcode,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Database,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Layers,
  Package,
  Receipt,
  ScanBarcode,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 md:space-y-36">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Layers className="w-3.5 h-3.5" />
            Core Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Eight Essential Pillars.{" "}
            <span className="text-gradient-brand">One Cohesive Engine.</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Every module in ValGrow is natively integrated into the same database and general
            ledger. No third-party connectors, no sync delays.
          </p>
        </div>

        {/* =========================================================================
            FEATURE 1: Smart POS (Text Left, Visual Right)
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5" />
              Module 01 · Sales & Billing
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Smart POS with Rapid Multi-Tender Checkout
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Engineered for speed during peak retail rushes. Cashiers ring up sales by scanning
              barcodes or tapping touch tiles. Split payments across Cash, Cards, and UPI seamlessly.
            </p>
            <ul className="space-y-2.5 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>USB HID barcode scanner & thermal receipt printer ready</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Split payments (Cash, UPI QR, Credit Card, Customer Credit)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Immediate inventory deduction and ledger journal entry posting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Cash drawer opening, shift tallying, and cashier reconciliation</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link to="/login">
                  Explore POS Module <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* POS Interactive Mockup */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border/80 bg-surface shadow-lg overflow-hidden">
              {/* POS Window Header */}
              <div className="px-4 py-2.5 bg-surface-2 border-b border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Terminal 01 · Counter Main</span>
                  <span className="px-1.5 py-0.2 rounded bg-success/15 text-success text-[10px] font-semibold">
                    Shift Active
                  </span>
                </div>
                <div className="text-muted-foreground font-mono text-[11px]">Register #REG-104</div>
              </div>

              {/* POS Interface Body */}
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 bg-background/50">
                {/* Product Tiles (7 cols) */}
                <div className="sm:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Quick Catalog</span>
                    <span className="text-[11px] text-muted-foreground">Scan Barcode or Tap</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "RGB Mech Keyboard", sku: "SKU-7721", price: "$120.00", stock: "48 in stock" },
                      { name: "Wireless Mouse Pro", sku: "SKU-5420", price: "$45.00", stock: "112 in stock" },
                      { name: "USB-C Hub Multiport", sku: "SKU-9021", price: "$68.00", stock: "34 in stock" },
                      { name: "Thermal Paper Rolls (10pk)", sku: "SKU-1102", price: "$18.50", stock: "240 in stock" },
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-border/60 bg-surface hover:border-primary/50 transition-all cursor-pointer space-y-1 shadow-2xs"
                      >
                        <div className="text-xs font-medium text-foreground line-clamp-1">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{p.sku}</div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-primary font-mono">{p.price}</span>
                          <span className="text-[9px] text-muted-foreground">{p.stock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Cart & Tender (5 cols) */}
                <div className="sm:col-span-5 p-3.5 rounded-lg border border-border/60 bg-surface flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/40">
                      <span className="font-semibold text-foreground">Current Cart (3 items)</span>
                      <span className="text-muted-foreground font-mono">#9842</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1x RGB Mech Keyboard</span>
                        <span className="font-mono text-foreground font-medium">$120.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">1x Wireless Mouse Pro</span>
                        <span className="font-mono text-foreground font-medium">$45.00</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                        <span>Tax (8%)</span>
                        <span className="font-mono">$13.20</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-1 text-foreground">
                        <span>Total Due</span>
                        <span className="font-mono text-primary">$178.20</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <button type="button" className="py-1 rounded bg-surface-2 border border-border/60 font-medium">
                        Cash
                      </button>
                      <button type="button" className="py-1 rounded bg-primary text-primary-foreground font-semibold">
                        Card
                      </button>
                      <button type="button" className="py-1 rounded bg-surface-2 border border-border/60 font-medium">
                        UPI QR
                      </button>
                    </div>
                    <Button size="sm" className="w-full text-xs font-semibold h-8">
                      Complete Checkout ($178.20)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FEATURE 2: Inventory Management (Visual Left, Text Right)
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Inventory Table Preview */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-xl border border-border/80 bg-surface shadow-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-surface-2 border-b border-border/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-primary" />
                  Live Stock Matrix · All Warehouses
                </span>
                <span className="text-xs text-muted-foreground">Filter: Low Stock Alerts</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2/40 border-b border-border/40 text-muted-foreground font-medium">
                    <tr>
                      <th className="py-2.5 px-3.5">Product SKU</th>
                      <th className="py-2.5 px-3.5">Warehouse</th>
                      <th className="py-2.5 px-3.5 text-right">On Hand</th>
                      <th className="py-2.5 px-3.5 text-right">Reserved</th>
                      <th className="py-2.5 px-3.5 text-right">Available</th>
                      <th className="py-2.5 px-3.5">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                    {[
                      {
                        sku: "SKU-7721 (RGB Keyboard)",
                        wh: "Central Hub",
                        hand: "120",
                        res: "18",
                        avail: "102",
                        status: "Optimal",
                        statusColor: "text-success bg-success/10",
                      },
                      {
                        sku: "SKU-5420 (Wireless Mouse)",
                        wh: "North Retail Store",
                        hand: "8",
                        res: "2",
                        avail: "6",
                        status: "Low Stock",
                        statusColor: "text-warning bg-warning/15",
                      },
                      {
                        sku: "SKU-9021 (USB-C Hub)",
                        wh: "West Warehouse",
                        hand: "45",
                        res: "5",
                        avail: "40",
                        status: "Optimal",
                        statusColor: "text-success bg-success/10",
                      },
                      {
                        sku: "SKU-3301 (HDMI 4K Cable)",
                        wh: "Central Hub",
                        hand: "2",
                        res: "0",
                        avail: "2",
                        status: "Critical Reorder",
                        statusColor: "text-destructive bg-destructive/15",
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-2/40">
                        <td className="py-2.5 px-3.5 font-medium text-foreground">{row.sku}</td>
                        <td className="py-2.5 px-3.5 text-muted-foreground">{row.wh}</td>
                        <td className="py-2.5 px-3.5 text-right">{row.hand}</td>
                        <td className="py-2.5 px-3.5 text-right text-muted-foreground">{row.res}</td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-foreground">
                          {row.avail}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${row.statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 bg-surface-2/60 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span>Auto-PO generation enabled for Critical status</span>
                <span className="font-semibold text-primary">Warehouse routing active</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Boxes className="w-3.5 h-3.5" />
              Module 02 · Warehouse & Stock
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Multi-Warehouse Inventory with Batch & Serial Tracking
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Track stock across multiple stores, depots, and distribution centers. Prevent
              accidental stockouts with live reservation calculations and automated reorder triggers.
            </p>
            <ul className="space-y-2.5 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>On-hand vs. reserved vs. available formula across all locations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Batch & expiry date tracking for perishable or pharmaceutical goods</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Inter-branch stock transfer orders and stock-adjustment audit logs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>FIFO, LIFO, and weighted average cost inventory valuation</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link to="/login">
                  Explore Inventory Module <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FEATURE 3: Purchasing Management (Text Left, Visual Right)
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <ShoppingCart className="w-3.5 h-3.5" />
              Module 03 · Procurement (P2P)
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Procure-to-Pay Automation & Supplier Reconciliation
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Eliminate supply chain delays. Generate Purchase Orders (PO), record Goods Receipts
              (GRN) as shipments arrive, and automatically reconcile vendor invoices against landed
              costs.
            </p>
            <ul className="space-y-2.5 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Vendor price books and multi-currency supplier purchasing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Goods Receipts (GRN) automatically credit warehouse stock on receipt</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>3-way matching between PO, delivery note, and supplier bill</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Landed cost allocation (freight, duties, handling) into SKU cost</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link to="/login">
                  Explore Purchasing <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Purchasing Preview */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border/80 bg-surface shadow-lg overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">Purchase Order</div>
                  <div className="text-sm font-bold text-foreground font-mono">PO-2026-0814</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-success-soft text-success text-xs font-semibold">
                  Partially Received (80%)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-2 border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Supplier</span>
                  <span className="font-semibold text-foreground">Apex Hardware Ltd</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2 border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Delivery Target</span>
                  <span className="font-semibold text-foreground">Central Hub Bengaluru</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2 border border-border/40 col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground block text-[10px]">Total Order Amount</span>
                  <span className="font-semibold text-primary font-mono">$18,450.00</span>
                </div>
              </div>

              {/* GRN Step Bar */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    Latest Goods Receipt Note (GRN #1082)
                  </span>
                  <span className="text-success font-medium font-mono">+120 Units Stocked</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Stock levels in Central Warehouse increased immediately upon saving receipt.
                  Accounts payable invoice matched with zero variance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FEATURE 4: Customer Management & CRM (Visual Left, Text Right)
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Customer Card Preview */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-xl border border-border/80 bg-surface shadow-lg overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center font-mono">
                    NS
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Northwind Superstores</div>
                    <div className="text-xs text-muted-foreground">Wholesale Tier A · Net-30 Terms</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-success-soft text-success">
                  Credit Good
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-2 border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Credit Limit</span>
                  <span className="font-bold text-foreground font-mono">$50,000.00</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-2 border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Outstanding Balance</span>
                  <span className="font-bold text-warning font-mono">$12,400.00</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-2 border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Available Credit</span>
                  <span className="font-bold text-success font-mono">$37,600.00</span>
                </div>
              </div>

              {/* Recent Orders timeline */}
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-semibold text-muted-foreground">Recent Orders & Statements</div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded bg-surface-2/60">
                    <span>INV #9812 · 48x Keyboards</span>
                    <span className="text-foreground font-semibold">$5,760.00 (Paid)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-surface-2/60">
                    <span>INV #9740 · 120x Cables</span>
                    <span className="text-warning font-semibold">$1,440.00 (Due in 14d)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Module 04 · Customer 360° & AR
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Customer Relationships, Credit Limits & Sales History
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Maintain unified customer profiles across walk-in retail shoppers and high-volume B2B
              wholesale accounts. Enforce credit limits at POS and track receivables aging automatically.
            </p>
            <ul className="space-y-2.5 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Unified retail & wholesale customer master directory</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Credit limits and aging receivables ledger (30/60/90 days)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Customer purchase histories and quick receipt lookups</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Automated customer balance statements and payment links</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link to="/login">
                  Explore CRM Module <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FEATURE 5: Business Analytics & Reporting (Text Left, Visual Right)
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" />
              Module 05 · Intelligence & Reports
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Executive Business Analytics & Financial Reporting
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Transform raw transaction data into actionable business intelligence. Understand sales
              velocity, branch gross margins, dead inventory, and tax obligations with exportable
              reports.
            </p>
            <ul className="space-y-2.5 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Real-time Gross Profit Margin tracking by category & SKU</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Multi-branch sales comparisons and cashier throughput audits</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Inventory turnover, stock movement velocity, and aging analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>One-click export to Excel, CSV, and tax compliance formats</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link to="/login">
                  Explore Analytics <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Analytics Visual Preview */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border/80 bg-surface shadow-lg overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Category Profitability & Sales Velocity
                </span>
                <span className="text-xs text-muted-foreground font-mono">Q4 Consolidated</span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { category: "Computer Peripherals", sales: "$68,420", margin: "38.2%", progress: "w-3/4" },
                  { category: "Audio & Accessories", sales: "$34,180", margin: "42.5%", progress: "w-1/2" },
                  { category: "Office Consumables", sales: "$18,920", margin: "24.1%", progress: "w-1/3" },
                  { category: "Network Hardware", sales: "$6,930", margin: "31.8%", progress: "w-1/6" },
                ].map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-surface-2/60 border border-border/40 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{c.category}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-foreground">{c.sales}</span>
                        <span className="text-success font-semibold">{c.margin} margin</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                      <div className={`h-full bg-primary rounded-full ${c.progress}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FEATURE 6: Accounting Management (Visual Left, Text Right)
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Accounting Journal Entry Preview */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-xl border border-border/80 bg-surface shadow-lg overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-foreground">General Ledger Auto-Entry</span>
                  <div className="text-xs text-muted-foreground font-mono">JE #8942 · Linked to POS Sale #9842</div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-success-soft text-success">
                  Balanced (100%)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-surface-2 border-b border-border/40 text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3">Account Code & Title</th>
                      <th className="py-2 px-3 text-right">Debit ($)</th>
                      <th className="py-2 px-3 text-right">Credit ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-[11px]">
                    <tr>
                      <td className="py-2 px-3 text-foreground font-medium">1010 - Cash & Bank Clearing</td>
                      <td className="py-2 px-3 text-right text-success font-semibold">178.20</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">-</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-foreground font-medium">4010 - Sales Revenue (Retail)</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">-</td>
                      <td className="py-2 px-3 text-right text-foreground font-semibold">165.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-foreground font-medium">2020 - Output Sales Tax (GST/VAT)</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">-</td>
                      <td className="py-2 px-3 text-right text-foreground font-semibold">13.20</td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-border/60 font-bold bg-surface-2/40">
                    <tr>
                      <td className="py-2 px-3 text-foreground">Total Posting</td>
                      <td className="py-2 px-3 text-right text-success">178.20</td>
                      <td className="py-2 px-3 text-right text-foreground">178.20</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="text-xs text-muted-foreground">
                Automated double-entry posting ensures audit compliance with zero end-of-day re-entry.
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <CircleDollarSign className="w-3.5 h-3.5" />
              Module 06 · Financial Accounting
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Native Double-Entry Ledger & Financial Records
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              No more manual bookkeeping or reconciling bank statements by hand. Every POS sale,
              purchase invoice, and stock write-off generates a balanced double-entry journal entry.
            </p>
            <ul className="space-y-2.5 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Strict double-entry general ledger with balanced debit/credit enforcement</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Accounts Payable (AP) and Accounts Receivable (AR) ledgers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Automatic Trial Balance, Profit & Loss (P&L), and Balance Sheet generation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Tax compliance reporting (GST, VAT, Sales Tax) by jurisdiction</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link to="/login">
                  Explore Accounting <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FEATURE 7: Multi-Branch & Role-Based Security (Text Left, Visual Right)
        ========================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <GitBranch className="w-3.5 h-3.5" />
              Module 07 · Multi-Branch & RBAC
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Multi-Branch Governance with Strict Role-Based Security
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Expand from a single location to a nationwide network. Grant cashiers access only to
              their register while headquarters executives view consolidated business performance.
            </p>
            <ul className="space-y-2.5 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Central HQ control with localized branch registers and price books</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Fine-grained permissions for Cashier, Billing, Warehouse, Manager, and Owner</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Complete immutable audit logs tracking every change and transaction</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Strict multi-tenant isolation ensuring complete data security</span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="font-medium">
                <Link to="/login">
                  Explore Branch Management <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Multi-Branch Diagram Preview */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border/80 bg-surface shadow-lg overflow-hidden p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Enterprise Organization Topology
                </span>
                <span className="text-xs text-success font-medium">All Branches Synchronized</span>
              </div>

              {/* HQ Node */}
              <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">Headquarters (HQ Bengaluru)</div>
                  <div className="text-[11px] text-muted-foreground">Consolidated Financials · Catalog Master · RBAC</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground font-semibold">
                  HQ Admin
                </span>
              </div>

              {/* Connecting Lines */}
              <div className="flex justify-center my-1 text-muted-foreground">
                <div className="h-4 w-0.5 bg-border" />
              </div>

              {/* Sub Branches Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-2 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">North Hub (Delhi)</span>
                    <span className="text-[10px] text-success font-medium">Online</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">4 Active Registers · 1 Warehouse</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Scope: Delhi Branch Only</div>
                </div>

                <div className="p-3 rounded-lg bg-surface-2 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">West Hub (Mumbai)</span>
                    <span className="text-[10px] text-success font-medium">Online</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">2 Active Registers · 1 Warehouse</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Scope: Mumbai Branch Only</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FEATURE 8: AI-Powered Intelligence (Platform Vision)
        ========================================================================== */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
                <Sparkles className="w-3.5 h-3.5" />
                Module 08 · Platform Vision
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                AI-Powered Business Intelligence & Autonomous Forecasting
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Experience the future of enterprise management. Our intelligent engine analyzes your
                sales velocity and supply lead times to proactively detect anomalies, recommend
                restocking quantities, and answer natural language queries.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-border/60">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Predictive Demand Forecasting</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-border/60">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Automated Stockout Warnings</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-border/60">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Margin Anomaly Detection</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-border/60">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Natural Language BI Queries</span>
                </div>
              </div>
            </div>

            {/* AI Assistant Preview Card */}
            <div className="lg:col-span-5">
              <div className="p-4 sm:p-5 rounded-xl bg-surface border border-primary/30 shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span className="font-semibold text-foreground">ValGrow Autonomous Copilot</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Vision Preview</span>
                </div>

                <div className="p-3 rounded-lg bg-surface-2/80 border border-border/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Demand Surge Alert · Mechanical Keyboards
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sales velocity increased by <span className="text-foreground font-semibold">32%</span> over the last 7 days. At current burn rate, Central Hub will stock out in 4 days.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button type="button" className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold">
                      Create Draft PO (80 units)
                    </button>
                    <button type="button" className="px-2 py-1 rounded bg-surface border border-border/60 text-[10px] text-muted-foreground">
                      Dismiss
                    </button>
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

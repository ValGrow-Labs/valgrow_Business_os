import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Barcode,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Download,
  Filter,
  Layers,
  LayoutDashboard,
  Package,
  Plus,
  Receipt,
  ScanBarcode,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingProductShowcase() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "pos" | "inventory" | "products" | "customers" | "reports"
  >("dashboard");

  const showcaseTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pos", label: "POS Terminal", icon: ShoppingBag },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "products", label: "Products", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ] as const;

  return (
    <section id="modules" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Product Showcase
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Explore the Real <span className="text-gradient-brand">ValGrow Workspace</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Switch between actual modules below to experience how each business operation is
            structured inside the application.
          </p>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 scrollbar-none gap-2">
          {showcaseTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                    : "bg-surface-2/70 text-muted-foreground border-border/60 hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Frame */}
        <div className="rounded-2xl border border-border/80 bg-surface shadow-xl overflow-hidden">
          {/* Top Frame Header */}
          <div className="px-5 py-3 bg-surface-2 border-b border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-destructive/60 inline-block" />
                <span className="w-3 h-3 rounded-full bg-warning/60 inline-block" />
                <span className="w-3 h-3 rounded-full bg-success/60 inline-block" />
              </div>
              <span className="text-muted-foreground font-mono text-[11px] hidden sm:inline">
                https://app.valgrow.dev/{activeTab}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Active Organization:</span>
              <span className="px-2 py-0.5 rounded bg-surface border border-border/60 font-semibold text-foreground text-[11px]">
                ValGrow Holdings (Enterprise)
              </span>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-semibold">
                <Link to="/login">Sign In →</Link>
              </Button>
            </div>
          </div>

          {/* Module Content View */}
          <div className="p-5 sm:p-8 bg-background/50 min-h-[440px]">
            {/* 1. DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Executive Overview</h3>
                    <p className="text-xs text-muted-foreground">
                      Real-time consolidated KPI performance across 3 active branches.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-surface-2 border border-border/60 text-xs font-mono">
                      Last synced: Just now
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1">
                    <span className="text-xs text-muted-foreground">Monthly Revenue</span>
                    <div className="text-2xl font-bold font-mono text-foreground">$128,450.00</div>
                    <span className="text-xs text-success font-medium">+18.4% vs last mo</span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1">
                    <span className="text-xs text-muted-foreground">Counter POS Sales</span>
                    <div className="text-2xl font-bold font-mono text-foreground">$14,280.50</div>
                    <span className="text-xs text-muted-foreground">184 orders today</span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1">
                    <span className="text-xs text-muted-foreground">Stock Health</span>
                    <div className="text-2xl font-bold font-mono text-foreground">99.2%</div>
                    <span className="text-xs text-warning font-medium">4 Low Stock Alerts</span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface border border-border/60 space-y-1">
                    <span className="text-xs text-muted-foreground">Gross Profit Margin</span>
                    <div className="text-2xl font-bold font-mono text-foreground">34.8%</div>
                    <span className="text-xs text-success font-medium">Target Met (&gt;30%)</span>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-surface border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">30-Day Revenue Trend</span>
                    <span className="text-xs text-muted-foreground font-mono">Double-Entry Verified</span>
                  </div>
                  <div className="h-44 w-full relative">
                    <svg viewBox="0 0 500 120" className="w-full h-full" preserveAspectRatio="none">
                      <path
                        d="M0,90 Q120,40 250,70 T500,20 L500,120 L0,120 Z"
                        fill="var(--color-primary)"
                        opacity="0.15"
                      />
                      <path
                        d="M0,90 Q120,40 250,70 T500,20"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* 2. POS VIEW */}
            {activeTab === "pos" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Point of Sale Terminal</h3>
                    <p className="text-xs text-muted-foreground">
                      Session #SESS-4019 &bull; Cashier Counter Bengaluru HQ
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border/60 text-xs font-mono">
                      <Barcode className="w-4 h-4 text-primary" />
                      <span>Scanner Ready (USB HID)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-7 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        readOnly
                        value=""
                        placeholder="Scan barcode or search product name / SKU..."
                        className="w-full h-9 pl-9 pr-4 rounded-lg border border-border/60 bg-surface text-xs focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { name: "RGB Gaming Keyboard", sku: "KB-RGB-01", price: "$120.00" },
                        { name: "Precision Mouse", sku: "MS-PRO-02", price: "$45.00" },
                        { name: "4K Monitor 27inch", sku: "MN-4K-27", price: "$320.00" },
                        { name: "USB-C Multi Hub", sku: "HB-USBC-04", price: "$68.00" },
                        { name: "Desk Pad XL", sku: "AC-DPAD-05", price: "$25.00" },
                        { name: "Thermal Receipt Rolls", sku: "CS-TROL-06", price: "$18.50" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-border/60 bg-surface space-y-1 hover:border-primary/50 transition-all cursor-pointer shadow-2xs"
                        >
                          <div className="text-xs font-medium text-foreground line-clamp-1">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{item.sku}</div>
                          <div className="text-xs font-bold text-primary font-mono">{item.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-5 p-4 rounded-xl border border-border/60 bg-surface space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs font-semibold">
                      <span>Current Order (#ORD-9842)</span>
                      <span className="text-muted-foreground font-mono">3 Items</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>1x RGB Gaming Keyboard</span>
                        <span className="font-mono font-medium">$120.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Precision Mouse</span>
                        <span className="font-mono font-medium">$45.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Thermal Receipt Rolls</span>
                        <span className="font-mono font-medium">$18.50</span>
                      </div>
                      <div className="pt-2 border-t border-border/40 flex justify-between font-bold text-sm">
                        <span>Grand Total</span>
                        <span className="font-mono text-primary">$183.50</span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        <button type="button" className="py-1.5 rounded bg-surface-2 border border-border/60 font-medium">
                          Cash ($183.50)
                        </button>
                        <button type="button" className="py-1.5 rounded bg-primary text-primary-foreground font-bold">
                          Card ($183.50)
                        </button>
                        <button type="button" className="py-1.5 rounded bg-surface-2 border border-border/60 font-medium">
                          UPI QR
                        </button>
                      </div>
                      <Button size="sm" className="w-full text-xs font-semibold">
                        Complete Sale & Print Thermal Receipt
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. INVENTORY VIEW */}
            {activeTab === "inventory" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Multi-Warehouse Inventory Matrix</h3>
                    <p className="text-xs text-muted-foreground">
                      Consolidated stock levels, reservations, and location breakdown.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      <Filter className="w-3.5 h-3.5 mr-1" /> Filter Warehouses
                    </Button>
                    <Button size="sm" className="h-8 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Stock Adjustment
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-surface overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2/60 border-b border-border/60 text-muted-foreground font-medium">
                      <tr>
                        <th className="py-3 px-4">Item Details</th>
                        <th className="py-3 px-4">Primary Warehouse</th>
                        <th className="py-3 px-4 text-right">On Hand</th>
                        <th className="py-3 px-4 text-right">Reserved</th>
                        <th className="py-3 px-4 text-right">Available</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {[
                        {
                          name: "RGB Gaming Keyboard",
                          sku: "KB-RGB-01",
                          wh: "Central Hub Bengaluru",
                          hand: 140,
                          res: 12,
                          avail: 128,
                          status: "In Stock",
                          color: "text-success bg-success/10",
                        },
                        {
                          name: "Precision Optical Mouse",
                          sku: "MS-PRO-02",
                          wh: "North Retail Store Delhi",
                          hand: 9,
                          res: 2,
                          avail: 7,
                          status: "Low Stock",
                          color: "text-warning bg-warning/15",
                        },
                        {
                          name: "4K IPS Display 27inch",
                          sku: "MN-4K-27",
                          wh: "West Warehouse Mumbai",
                          hand: 42,
                          res: 8,
                          avail: 34,
                          status: "In Stock",
                          color: "text-success bg-success/10",
                        },
                        {
                          name: "USB-C Multiport Adapter",
                          sku: "HB-USBC-04",
                          wh: "Central Hub Bengaluru",
                          hand: 3,
                          res: 1,
                          avail: 2,
                          status: "Reorder Triggered",
                          color: "text-destructive bg-destructive/15",
                        },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-2/30">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground font-sans">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground">{item.sku}</div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-sans">{item.wh}</td>
                          <td className="py-3 px-4 text-right font-medium">{item.hand}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">{item.res}</td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">{item.avail}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.color}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. PRODUCTS VIEW */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Product & SKU Master Catalog</h3>
                    <p className="text-xs text-muted-foreground">
                      Unified product specifications, cost vs. retail pricing, and margins.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-surface overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2/60 border-b border-border/60 text-muted-foreground font-medium">
                      <tr>
                        <th className="py-3 px-4">SKU / Barcode</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Cost ($)</th>
                        <th className="py-3 px-4 text-right">Retail ($)</th>
                        <th className="py-3 px-4 text-right">Gross Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {[
                        { sku: "KB-RGB-01", name: "RGB Gaming Keyboard", cat: "Peripherals", cost: "72.00", price: "120.00", margin: "40.0%" },
                        { sku: "MS-PRO-02", name: "Precision Optical Mouse", cat: "Peripherals", cost: "24.50", price: "45.00", margin: "45.5%" },
                        { sku: "MN-4K-27", name: "4K IPS Display 27inch", cat: "Displays", cost: "230.00", price: "320.00", margin: "28.1%" },
                        { sku: "HB-USBC-04", name: "USB-C Multiport Adapter", cat: "Accessories", cost: "38.00", price: "68.00", margin: "44.1%" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-2/30">
                          <td className="py-3 px-4 font-semibold text-foreground">{item.sku}</td>
                          <td className="py-3 px-4 font-sans text-foreground">{item.name}</td>
                          <td className="py-3 px-4 font-sans text-muted-foreground">{item.cat}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">{item.cost}</td>
                          <td className="py-3 px-4 text-right font-semibold text-primary">{item.price}</td>
                          <td className="py-3 px-4 text-right text-success font-bold">{item.margin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. CUSTOMERS VIEW */}
            {activeTab === "customers" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Customer 360° Directory</h3>
                    <p className="text-xs text-muted-foreground">
                      Credit limits, outstanding aging balances, and lifetime sales histories.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> New Customer
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Northwind Retailers Ltd",
                      contact: "contact@northwind.com",
                      tier: "Wholesale Tier A",
                      limit: "$50,000",
                      balance: "$12,400",
                      status: "Credit Good",
                    },
                    {
                      name: "Helio Logistics Network",
                      contact: "ops@heliologistics.com",
                      tier: "Enterprise Account",
                      limit: "$100,000",
                      balance: "$34,250",
                      status: "Net-30 Due",
                    },
                    {
                      name: "Metro Retail & Store #4",
                      contact: "finance@metroretail.org",
                      tier: "Commercial Partner",
                      limit: "$25,000",
                      balance: "$3,120",
                      status: "Credit Good",
                    },
                  ].map((cust, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border/60 bg-surface space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
                          {cust.tier}
                        </span>
                        <span className="text-[10px] text-success font-semibold">{cust.status}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{cust.name}</div>
                        <div className="text-xs text-muted-foreground">{cust.contact}</div>
                      </div>
                      <div className="pt-2 border-t border-border/40 flex justify-between text-xs font-mono">
                        <div>
                          <span className="text-muted-foreground text-[10px] block font-sans">Credit Limit</span>
                          <span className="font-semibold text-foreground">{cust.limit}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground text-[10px] block font-sans">Current Balance</span>
                          <span className="font-bold text-warning">{cust.balance}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. REPORTS VIEW */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Financial & Operational Reports</h3>
                    <p className="text-xs text-muted-foreground">
                      Profit & Loss statements, sales tax breakdown, and cashier performance audits.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      <Download className="w-3.5 h-3.5 mr-1" /> Export CSV / Excel
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/60 bg-surface space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Sales by Payment Mode (Oct 2026)</span>
                      <span className="text-[11px] text-muted-foreground font-mono">Total: $128,450</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between p-2 rounded bg-surface-2/60">
                        <span>Card Payments (Visa / MC)</span>
                        <span className="font-semibold text-foreground">$64,220.00 (50%)</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-surface-2/60">
                        <span>UPI / QR Digital Transfers</span>
                        <span className="font-semibold text-foreground">$38,535.00 (30%)</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-surface-2/60">
                        <span>Cash Counter Register</span>
                        <span className="font-semibold text-foreground">$19,267.50 (15%)</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-surface-2/60">
                        <span>Customer Credit / AR</span>
                        <span className="font-semibold text-foreground">$6,427.50 (5%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/60 bg-surface space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Branch Revenue Leaderboard</span>
                      <span className="text-[11px] text-success font-semibold">All Online</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2 rounded bg-surface-2/60">
                        <span className="font-medium text-foreground">Head Office Hub (Bengaluru)</span>
                        <span className="font-mono font-bold text-foreground">$72,400.00</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-surface-2/60">
                        <span className="font-medium text-foreground">North Store (Delhi)</span>
                        <span className="font-mono font-bold text-foreground">$34,150.00</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-surface-2/60">
                        <span className="font-medium text-foreground">West Depot (Mumbai)</span>
                        <span className="font-mono font-bold text-foreground">$21,900.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Calendar,
  Check,
  ChevronDown,
  Contact,
  Database,
  FileText,
  Lightbulb,
  Mic,
  Receipt,
  RefreshCw,
  Settings2,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardOverview } from "@/hooks/queries/useDashboardOverview";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import {
  HeroIllustration,
  PosCardIllustration,
  InventoryCardIllustration,
  PurchasingCardIllustration,
  CustomersCardIllustration,
  ReportsCardIllustration,
  ExpensesCardIllustration,
} from "./overview-illustrations";

export function OverviewHeader() {
  const { data: currentUser } = useCurrentUser();
  const firstName = currentUser?.user?.firstName || "Team";

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          Good day, {firstName}! <span className="text-2xl">👋</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Here is your live organization overview for today.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>{todayStr}</span>
        </div>
      </div>
    </div>
  );
}

export function OverviewMetricsSection() {
  const { data, isLoading, isError, refetch } = useDashboardOverview();

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">Live Business Metrics</h2>
          <span className="text-xs text-slate-400">Fetching real-time API metrics...</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-slate-100" />
                <div className="h-4 w-12 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="h-6 w-24 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span className="font-medium">
            Failed to load live dashboard overview metrics from the API endpoint.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="h-8 gap-1.5 border-rose-300 text-rose-800 hover:bg-rose-100 font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </Button>
      </div>
    );
  }

  const metrics = [
    {
      title: "Today's Sales",
      value: `₹${Number(data.todaysTotalPosSales).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: `${data.todaysOrderCount} completed order(s)`,
      icon: Receipt,
      iconBg: "bg-emerald-100 text-emerald-700",
      badge: "Today",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      url: "/pos",
    },
    {
      title: "Today's Orders",
      value: String(data.todaysOrderCount),
      subtitle: "POS sales completed",
      icon: ShoppingCart,
      iconBg: "bg-purple-100 text-purple-700",
      badge: "Completed",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      url: "/pos",
    },
    {
      title: "Active Products",
      value: String(data.totalActiveProducts),
      subtitle: "Items in catalog",
      icon: Boxes,
      iconBg: "bg-blue-100 text-blue-700",
      badge: "Catalog",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      url: "/products",
    },
    {
      title: "Low Stock Items",
      value: String(data.lowStockProductCount),
      subtitle: "At/below reorder level",
      icon: AlertTriangle,
      iconBg: data.lowStockProductCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600",
      badge: data.lowStockProductCount > 0 ? "Alert" : "Normal",
      badgeClass: data.lowStockProductCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200",
      url: "/inventory",
    },
    {
      title: "Open POs",
      value: String(data.openPurchaseOrderCount),
      subtitle: `${data.pendingGoodsReceiptsCount} pending GRN(s)`,
      icon: FileText,
      iconBg: "bg-indigo-100 text-indigo-700",
      badge: "Procurement",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      url: "/purchase-orders",
    },
    {
      title: "Active Customers",
      value: String(data.activeCustomerCount),
      subtitle: "Registered profiles",
      icon: Users,
      iconBg: "bg-rose-100 text-rose-700",
      badge: "Directory",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      url: "/customers",
    },
  ];

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900">Live Business Overview</h2>
        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live API Data
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => {
          const IconComp = m.icon;
          return (
            <Link
              key={m.title}
              to={m.url}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-purple-300 hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.iconBg} shadow-2xs`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${m.badgeClass}`}>
                    {m.badge}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">{m.title}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
                    {m.value}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">
                    {m.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function WelcomeHeroBanner() {
  const [searchValue, setSearchValue] = useState("");

  const quickSuggestions = [
    {
      label: "Boost sales ideas",
      icon: Lightbulb,
      bg: "bg-purple-50/90 border-purple-200/80 text-purple-900 hover:bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Check low stock",
      icon: TrendingUp,
      bg: "bg-sky-50/90 border-sky-200/80 text-sky-900 hover:bg-sky-100",
      iconColor: "text-sky-600",
    },
    {
      label: "Find new customers",
      icon: Users,
      bg: "bg-emerald-50/90 border-emerald-200/80 text-emerald-900 hover:bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Review this week",
      icon: FileText,
      bg: "bg-amber-50/90 border-amber-200/80 text-amber-900 hover:bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#EDE6FF] via-[#E7DBFF] to-[#F3EBFF] p-6 sm:p-8 lg:p-10 border border-purple-100/80 shadow-xs">
      <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-purple-300/35 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 bottom-0 h-56 w-56 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4 sm:space-y-5 z-10">
          <div className="flex items-center gap-1.5 text-[#7C3AED] font-bold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-[#7C3AED]" />
            <span>WELCOME TO</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#2B1066] leading-tight">
            ValGrow <span className="text-[#6D28D9]">Business OS</span>
          </h2>
          <p className="text-sm sm:text-base text-[#4C2694] font-medium max-w-xl leading-relaxed">
            Manage your business, marketing and suppliers in one place.
          </p>

          <div className="pt-2 max-w-2xl">
            <div className="relative flex items-center gap-2 rounded-full bg-white p-2 pl-3 border border-purple-200/80 shadow-[0_0_25px_rgba(147,51,234,0.22)] ring-4 ring-purple-300/20 focus-within:ring-purple-400/30 transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#9333EA] text-white shadow-sm shadow-purple-500/40">
                <Sparkles className="h-4.5 w-4.5" />
              </div>

              <div className="flex flex-1 items-center overflow-hidden">
                {!searchValue && (
                  <span className="font-bold text-[#6D28D9] text-xs sm:text-sm shrink-0 mr-1 select-none">
                    Ask ValGrow:
                  </span>
                )}
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchValue ? "" : "What should I focus on today?"}
                  className="w-full bg-transparent py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
                />
              </div>

              <button
                type="button"
                className="hidden sm:flex items-center gap-1 rounded-full bg-purple-50 border border-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors shrink-0"
              >
                <Lightbulb className="h-3.5 w-3.5 text-purple-600" />
                <span>Get smart insights</span>
                <ChevronDown className="h-3 w-3 text-purple-500" />
              </button>

              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors shrink-0"
              >
                <Mic className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] text-white shadow-md shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            {quickSuggestions.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchValue(item.label)}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02] ${item.bg}`}
                >
                  <IconComp className={`h-3.5 w-3.5 ${item.iconColor}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center relative">
          <HeroIllustration className="w-full max-w-lg lg:max-w-none" />
        </div>
      </div>
    </div>
  );
}

export function BusinessHubSection() {
  const cards = [
    {
      title: "POS",
      description: "Sell and manage effortlessly",
      url: "/pos",
      iconBg: "bg-[#F3E8FF] text-[#7C3AED]",
      btnBg: "bg-purple-50 text-[#7C3AED] hover:bg-purple-100",
      icon: Receipt,
    },
    {
      title: "Inventory",
      description: "Track stock in real-time",
      url: "/inventory",
      iconBg: "bg-[#E0F2FE] text-[#0284C7]",
      btnBg: "bg-sky-50 text-[#0284C7] hover:bg-sky-100",
      icon: Boxes,
    },
    {
      title: "Purchasing",
      description: "Manage suppliers and orders",
      url: "/purchasing",
      iconBg: "bg-[#DCFCE7] text-[#16A34A]",
      btnBg: "bg-emerald-50 text-[#16A34A] hover:bg-emerald-100",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      description: "Build stronger customer relationships",
      url: "/customers",
      iconBg: "bg-[#FFE4E6] text-[#E11D48]",
      btnBg: "bg-rose-50 text-[#E11D48] hover:bg-rose-100",
      icon: Users,
    },
    {
      title: "Reports",
      description: "Get insights and grow smarter",
      url: "/financial-reports",
      iconBg: "bg-[#FEF3C7] text-[#D97706]",
      btnBg: "bg-amber-50 text-[#D97706] hover:bg-amber-100",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Business Hub</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Quick access to your key operations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.url}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-purple-200 hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} shadow-2xs`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${card.btnBg} transition-transform group-hover:translate-x-0.5`}>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{card.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed font-normal">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function FeatureCardsSection() {
  const featureCards = [
    {
      title: "POS",
      badge: "POINT OF SALE",
      heading: "Run your sales smoothly",
      description: "Create bills, accept payments and manage customer transactions quickly and easily.",
      bullets: [
        "Create and manage bills",
        "Multiple payment methods",
        "Apply discounts and offers",
        "Print or share receipts",
      ],
      url: "/pos",
      badgeClass: "bg-emerald-100 text-emerald-800",
      cardClass: "bg-[#F2FBF5] border-emerald-100",
      buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      checkClass: "text-emerald-600",
      icon: Receipt,
      iconBg: "bg-emerald-100 text-emerald-700",
      Illustration: PosCardIllustration,
    },
    {
      title: "Inventory",
      badge: "STOCK MANAGEMENT",
      heading: "Stay in control of your stock",
      description: "Track products, stock levels and stock movement in one place.",
      bullets: [
        "Add and manage products",
        "Track stock in real time",
        "View stock movement history",
        "Get low stock alerts",
      ],
      url: "/inventory",
      badgeClass: "bg-blue-100 text-blue-800",
      cardClass: "bg-[#F0F7FF] border-blue-100",
      buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      checkClass: "text-blue-600",
      icon: Boxes,
      iconBg: "bg-blue-100 text-blue-700",
      Illustration: InventoryCardIllustration,
    },
    {
      title: "Purchasing",
      badge: "PROCUREMENT",
      heading: "Make purchasing easier",
      description: "Buy items, manage suppliers and create purchase orders efficiently.",
      bullets: [
        "Manage supplier details",
        "Create and track purchase orders",
        "Record incoming stock",
        "View purchase history",
      ],
      url: "/purchasing",
      badgeClass: "bg-orange-100 text-orange-800",
      cardClass: "bg-[#FFF8F0] border-orange-100",
      buttonClass: "bg-orange-500 hover:bg-orange-600 text-white",
      checkClass: "text-orange-500",
      icon: ShoppingCart,
      iconBg: "bg-orange-100 text-orange-700",
      Illustration: PurchasingCardIllustration,
    },
    {
      title: "Customers",
      badge: "RELATIONSHIP MANAGEMENT",
      heading: "Build better customer relationships",
      description: "Manage customer details, purchase history and outstanding amounts.",
      bullets: [
        "Add and manage customer profiles",
        "View purchase history",
        "Track due amounts",
        "Group customers (e.g., regular, VIP)",
      ],
      url: "/customers",
      badgeClass: "bg-purple-100 text-purple-800",
      cardClass: "bg-[#F8F5FF] border-purple-100",
      buttonClass: "bg-purple-600 hover:bg-purple-700 text-white",
      checkClass: "text-purple-600",
      icon: Users,
      iconBg: "bg-purple-100 text-purple-700",
      Illustration: CustomersCardIllustration,
    },
    {
      title: "Reports",
      badge: "BUSINESS INSIGHTS",
      heading: "Understand your business better",
      description: "View sales, profit, stock and other important reports.",
      bullets: [
        "Sales and profit reports",
        "Inventory reports",
        "Customer reports",
        "Export and share reports",
      ],
      url: "/financial-reports",
      badgeClass: "bg-teal-100 text-teal-800",
      cardClass: "bg-[#F0FDFB] border-teal-100",
      buttonClass: "bg-teal-600 hover:bg-teal-700 text-white",
      checkClass: "text-teal-600",
      icon: BarChart3,
      iconBg: "bg-teal-100 text-teal-700",
      Illustration: ReportsCardIllustration,
    },
    {
      title: "Expenses",
      badge: "COST MANAGEMENT",
      heading: "Keep track of your business expenses",
      description: "Record and manage all business expenses in one place.",
      bullets: [
        "Add and categorize expenses",
        "View expense history",
        "Track monthly expenses",
        "Analyze spending reports",
      ],
      url: "/supplier-invoices",
      badgeClass: "bg-rose-100 text-rose-800",
      cardClass: "bg-[#FFF5F7] border-rose-100",
      buttonClass: "bg-rose-600 hover:bg-rose-700 text-white",
      checkClass: "text-rose-600",
      icon: Receipt,
      iconBg: "bg-rose-100 text-rose-700",
      Illustration: ExpensesCardIllustration,
    },
  ];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Explore What ValGrow Business OS Can Do
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Powerful tools to run and grow your business
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs gap-1.5 shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {featureCards.map((card) => {
          const HeaderIcon = card.icon;
          const Illustration = card.Illustration;

          return (
            <div
              key={card.title}
              className={`rounded-3xl border ${card.cardClass} p-6 sm:p-7 shadow-xs flex flex-col justify-between`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-7 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${card.iconBg}`}>
                      <HeaderIcon className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-bold text-slate-900 text-base">{card.title}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${card.badgeClass}`}>
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {card.heading}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-1">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Check className={`h-4 w-4 shrink-0 ${card.checkClass}`} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <Link to={card.url}>
                      <Button size="sm" className={`rounded-xl h-9 text-xs font-semibold px-4 ${card.buttonClass}`}>
                        Learn more →
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="sm:col-span-5 flex justify-center">
                  <Illustration />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Add Your Business Data",
      description: "Set up your products, customers, suppliers and other business information.",
      numBg: "bg-purple-600 text-white",
      iconBg: "bg-purple-100 text-purple-700",
      icon: Database,
    },
    {
      num: "02",
      title: "Manage Your Operations",
      description: "Use POS, Inventory, Purchasing and Customers from one platform.",
      numBg: "bg-blue-600 text-white",
      iconBg: "bg-blue-100 text-blue-700",
      icon: Settings2,
    },
    {
      num: "03",
      title: "Track Your Business",
      description: "Use reports and insights to understand what's happening in real time.",
      numBg: "bg-emerald-600 text-white",
      iconBg: "bg-emerald-100 text-emerald-700",
      icon: BarChart3,
    },
    {
      num: "04",
      title: "Take Better Decisions",
      description: "Use the information to improve your day-to-day operations and grow your business.",
      numBg: "bg-orange-500 text-white",
      iconBg: "bg-orange-100 text-orange-600",
      icon: Target,
    },
  ];

  return (
    <div className="rounded-3xl border border-purple-100 bg-[#F6F4FE] p-6 sm:p-8 lg:p-10 shadow-xs space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">How ValGrow Business OS Works</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Get started in a few simple steps and see the difference.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div key={step.num} className="relative flex flex-col justify-between bg-white rounded-2xl p-5 border border-purple-100/60 shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step.numBg}`}>
                    {step.num}
                  </span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${step.iconBg}`}>
                    <StepIcon className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{step.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
              </div>

              {idx < steps.length - 1 ? (
                <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-purple-300">
                  <ArrowRight className="h-5 w-5" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

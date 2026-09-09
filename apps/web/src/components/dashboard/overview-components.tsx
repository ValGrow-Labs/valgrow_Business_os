import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Calendar,
  Check,
  ChevronDown,
  Contact,
  Database,
  Receipt,
  Settings2,
  ShoppingCart,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          Good morning, John! <span className="text-2xl">👋</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Here's what's happening in your business today.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 transition-colors">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>21 May 2026 - 27 May 2026</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
        </button>
      </div>
    </div>
  );
}

export function WelcomeHeroBanner() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EDE5FF] via-[#E4D9FF] to-[#F2EBFF] p-6 sm:p-8 lg:p-10 border border-purple-100/60 shadow-2xs">
      {/* Decorative Orbs */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-purple-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2 text-purple-700 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="h-4.5 w-4.5 text-purple-600" />
            <span>Welcome to</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#2B1266] leading-tight">
            ValGrow Business OS
          </h2>
          <p className="text-sm sm:text-base text-[#4C2694] font-medium max-w-xl leading-relaxed">
            Manage your business, marketing and suppliers in one place.
          </p>

          {/* Search Box inside Hero */}
          <div className="pt-2">
            <div className="relative flex items-center max-w-xl rounded-full bg-white p-1.5 pl-4 shadow-sm border border-purple-100/80">
              <Sparkles className="h-5 w-5 shrink-0 text-purple-600 mr-2" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Ask ValGrow: What should I focus on today?"
                className="w-full bg-transparent py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
              />
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5B21B6] text-white shadow-sm hover:bg-purple-800 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Graphic Illustration */}
        <div className="lg:col-span-5 flex justify-center relative">
          <HeroIllustration className="w-full max-w-md lg:max-w-none" />
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
                {/* Content Side */}
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

                {/* Illustration Side */}
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
                {/* Top badges */}
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

              {/* Connecting Arrow for desktop */}
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

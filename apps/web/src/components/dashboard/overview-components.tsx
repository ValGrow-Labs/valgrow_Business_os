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
    <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Good morning, John! <span className="text-2xl">👋</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Here's what's happening in your business.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 transition-colors">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span>21 May 2026 - 27 May 2026</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}

export function WelcomeHeroBanner() {
  const [searchValue, setSearchValue] = useState("");

  const suggestionChips = [
    "What should I focus on today?",
    "Which products are low in stock?",
    "How are my sales this week?",
    "Who are my inactive customers?",
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#240A59] via-[#3C158A] to-[#1E074A] p-6 sm:p-8 lg:p-10 text-white shadow-xl">
      {/* Decorative sparkle Orbs */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 bottom-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Left Text & Search Content */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2 text-purple-300">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">Welcome to</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            ValGrow Business OS
          </h2>
          <p className="text-sm sm:text-base text-purple-100/90 max-w-xl font-normal leading-relaxed">
            Manage your business smarter, simpler and in one place.
          </p>

          {/* Search Box inside Hero */}
          <div className="pt-2">
            <div className="relative flex items-center max-w-xl rounded-2xl bg-white/95 backdrop-blur-md p-1.5 shadow-lg border border-white/30">
              <Sparkles className="ml-3 h-5 w-5 shrink-0 text-purple-600" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Ask ValGrow: What should I focus on today?"
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Prompt Chips */}
          <div className="pt-1">
            <p className="text-xs text-purple-300/90 font-medium mb-2.5">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSearchValue(chip)}
                  className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 text-xs text-purple-100 font-medium transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="lg:col-span-5 flex justify-center">
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
      description: "Create bills, accept payments and print receipts.",
      url: "/pos",
      buttonText: "Launch POS →",
      bgColor: "bg-emerald-50 text-emerald-600",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
      icon: Receipt,
    },
    {
      title: "Inventory",
      description: "Manage stock, products and stock movement.",
      url: "/inventory",
      buttonText: "Explore Inventory →",
      bgColor: "bg-blue-50 text-blue-600",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: Boxes,
    },
    {
      title: "Purchasing",
      description: "Buy items, manage suppliers and orders.",
      url: "/purchasing",
      buttonText: "Place Order →",
      bgColor: "bg-orange-50 text-orange-600",
      buttonColor: "bg-orange-500 hover:bg-orange-600 text-white",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      description: "View customers, purchase history and due amount.",
      url: "/customers",
      buttonText: "Manage Customers →",
      bgColor: "bg-purple-50 text-purple-600",
      buttonColor: "bg-purple-600 hover:bg-purple-700 text-white",
      icon: Users,
    },
    {
      title: "Reports",
      description: "View sales, profit, stock and other reports.",
      url: "/financial-reports",
      buttonText: "Analyze Reports →",
      bgColor: "bg-teal-50 text-teal-600",
      buttonColor: "bg-teal-600 hover:bg-teal-700 text-white",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-lg font-bold text-slate-900">Business Hub</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-center mb-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.bgColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-center font-bold text-slate-900 text-base">{card.title}</h3>
                <p className="mt-1 text-center text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {card.description}
                </p>
              </div>

              <Link to={card.url} className="mt-4 block">
                <Button
                  size="sm"
                  className={`w-full rounded-xl h-9 text-xs font-semibold ${card.buttonColor} shadow-xs`}
                >
                  {card.buttonText}
                </Button>
              </Link>
            </div>
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
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Explore What ValGrow Business OS Can Do
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Powerful tools to manage every part of your business — all in one place.
        </p>
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

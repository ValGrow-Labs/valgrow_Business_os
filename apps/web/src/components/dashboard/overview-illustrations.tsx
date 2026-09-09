import React from "react";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center w-full ${className || ""}`}>
      <svg
        viewBox="0 0 520 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[520px] select-none"
      >
        <defs>
          <filter id="heroShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#4C1D95" floodOpacity="0.15" />
          </filter>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1E1B4B" floodOpacity="0.12" />
          </filter>
          <linearGradient id="laptopBody" x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="laptopScreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#EEF2FF" />
          </linearGradient>
          <linearGradient id="chartBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Script Text top right: Smarter Business Together */}
        <g transform="translate(450, 45)" textAnchor="end">
          <text
            fill="#5B21B6"
            fontSize="18"
            fontWeight="700"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
          >
            Smarter
          </text>
          <text
            y="20"
            fill="#5B21B6"
            fontSize="18"
            fontWeight="700"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
          >
            Business
          </text>
          <text
            y="40"
            fill="#5B21B6"
            fontSize="18"
            fontWeight="700"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
          >
            Together
          </text>
        </g>

        {/* Laptop Graphics */}
        <g filter="url(#heroShadow)" transform="translate(130, 80)">
          {/* Outer Bezel */}
          <rect x="0" y="0" width="220" height="140" rx="10" fill="url(#laptopBody)" />
          {/* Camera Notch */}
          <circle cx="110" cy="5" r="2" fill="#64748B" />
          {/* Inner Screen */}
          <rect x="8" y="10" width="204" height="122" rx="4" fill="url(#laptopScreen)" />
          
          {/* Screen Content: Dashboard UI Mockup */}
          {/* Top nav inside mockup */}
          <rect x="8" y="10" width="204" height="16" fill="#FFFFFF" />
          <circle cx="18" cy="18" r="3" fill="#E2E8F0" />
          <rect x="26" y="16" width="30" height="4" rx="2" fill="#94A3B8" />
          <circle cx="195" cy="18" r="4" fill="#818CF8" />
          <circle cx="204" cy="18" r="4" fill="#CBD5E1" />

          {/* Sidebar inside mockup */}
          <rect x="8" y="26" width="40" height="106" fill="#F1F5F9" />
          <rect x="14" y="34" width="28" height="4" rx="2" fill="#818CF8" />
          <rect x="14" y="44" width="28" height="3" rx="1.5" fill="#CBD5E1" />
          <rect x="14" y="52" width="28" height="3" rx="1.5" fill="#CBD5E1" />
          <rect x="14" y="60" width="28" height="3" rx="1.5" fill="#CBD5E1" />

          {/* Main content inside mockup */}
          {/* Bar Chart */}
          <rect x="56" y="34" width="70" height="50" rx="4" fill="#FFFFFF" />
          <rect x="64" y="60" width="8" height="18" rx="2" fill="#E2E8F0" />
          <rect x="76" y="50" width="8" height="28" rx="2" fill="url(#chartBarGrad)" />
          <rect x="88" y="44" width="8" height="34" rx="2" fill="#818CF8" />
          <rect x="100" y="54" width="8" height="24" rx="2" fill="url(#chartBarGrad)" />
          <rect x="112" y="40" width="8" height="38" rx="2" fill="#4F46E5" />

          {/* Pie Chart / Stat Box */}
          <rect x="132" y="34" width="72" height="50" rx="4" fill="#FFFFFF" />
          <circle cx="168" cy="59" r="16" fill="none" stroke="#E2E8F0" strokeWidth="6" />
          <path d="M168 43 A16 16 0 0 1 184 59" fill="none" stroke="#4F46E5" strokeWidth="6" />

          {/* Bottom Table inside mockup */}
          <rect x="56" y="90" width="148" height="36" rx="4" fill="#FFFFFF" />
          <rect x="64" y="96" width="50" height="4" rx="2" fill="#CBD5E1" />
          <rect x="64" y="104" width="80" height="3" rx="1.5" fill="#E2E8F0" />
          <rect x="64" y="112" width="60" height="3" rx="1.5" fill="#E2E8F0" />
          <rect x="170" y="96" width="26" height="4" rx="2" fill="#818CF8" />

          {/* Laptop Hinge Base */}
          <path d="M-15 140 H235 L225 150 H-5 Z" fill="#94A3B8" />
          <rect x="-20" y="148" width="260" height="6" rx="3" fill="#CBD5E1" />
        </g>

        {/* 3D Floating Card 1: Business */}
        <g filter="url(#cardShadow)" transform="translate(30, 75)">
          <rect x="0" y="0" width="85" height="70" rx="14" fill="#FFFFFF" />
          {/* Purple Icon Box */}
          <rect x="25" y="10" width="35" height="32" rx="10" fill="#F3E8FF" />
          <path d="M35 34 V24 M42 34 V18 M49 34 V28" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
          <text x="42" y="56" textAnchor="middle" fill="#1E1B4B" fontSize="10" fontWeight="700" fontFamily="sans-serif">Business</text>
        </g>

        {/* 3D Floating Card 2: Marketing */}
        <g filter="url(#cardShadow)" transform="translate(85, 160)">
          <rect x="0" y="0" width="90" height="70" rx="14" fill="#FFFFFF" />
          {/* Pink Icon Box */}
          <rect x="27" y="10" width="35" height="32" rx="10" fill="#FFE4E6" />
          {/* Megaphone icon */}
          <path d="M37 20 L47 16 V32 L37 28 H34 V20 H37 Z" fill="#E11D48" />
          <text x="45" y="56" textAnchor="middle" fill="#1E1B4B" fontSize="10" fontWeight="700" fontFamily="sans-serif">Marketing</text>
        </g>

        {/* 3D Floating Card 3: Suppliers */}
        <g filter="url(#cardShadow)" transform="translate(305, 165)">
          <rect x="0" y="0" width="85" height="70" rx="14" fill="#FFFFFF" />
          {/* Green Icon Box */}
          <rect x="25" y="10" width="35" height="32" rx="10" fill="#DCFCE7" />
          {/* Users icon */}
          <circle cx="38" cy="22" r="3.5" fill="#16A34A" />
          <path d="M32 32 C32 28.5 35 27 38 27 C41 27 44 28.5 44 32" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
          <circle cx="47" cy="22" r="2.5" fill="#16A34A" opacity="0.7" />
          <text x="42" y="56" textAnchor="middle" fill="#1E1B4B" fontSize="10" fontWeight="700" fontFamily="sans-serif">Suppliers</text>
        </g>

        {/* Potted Plant on Far Right */}
        <g filter="url(#cardShadow)" transform="translate(425, 160)">
          {/* Plant Leaves */}
          <path d="M30 35 C20 15 10 18 12 5 C25 15 28 30 30 35 Z" fill="#15803D" />
          <path d="M30 35 C38 10 48 12 45 0 C38 12 34 28 30 35 Z" fill="#22C55E" />
          <path d="M30 35 C12 25 5 35 0 25 C12 32 24 34 30 35 Z" fill="#16A34A" />
          <path d="M30 35 C48 25 55 35 60 25 C48 32 36 34 30 35 Z" fill="#4ADE80" />
          {/* Pot */}
          <path d="M18 35 H42 L38 70 H22 Z" fill="#FFFFFF" />
          <ellipse cx="30" cy="35" rx="12" ry="3" fill="#E2E8F0" />
        </g>
      </svg>
    </div>
  );
}

export function PosCardIllustration() {
  return (
    <img
      src="/illustrations/pos.jpg"
      alt="POS System"
      className="w-full h-auto object-contain select-none"
      draggable={false}
    />
  );
}

export function InventoryCardIllustration() {
  return (
    <img
      src="/illustrations/inventory.jpg"
      alt="Inventory Management"
      className="w-full h-auto object-contain select-none rounded-xl"
      draggable={false}
    />
  );
}

export function PurchasingCardIllustration() {
  return (
    <img
      src="/illustrations/purchasing.jpg"
      alt="Purchasing and Procurement"
      className="w-full h-auto object-contain select-none"
      draggable={false}
    />
  );
}

export function CustomersCardIllustration() {
  return (
    <img
      src="/illustrations/customers.jpg"
      alt="Customer Relationship Management"
      className="w-full h-auto object-contain select-none"
      draggable={false}
    />
  );
}

export function ReportsCardIllustration() {
  return (
    <img
      src="/illustrations/reports.jpg"
      alt="Business Reports and Analytics"
      className="w-full h-auto object-contain select-none rounded-xl"
      draggable={false}
    />
  );
}

export function ExpensesCardIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="calcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="calcScreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFF5F7" />
        </linearGradient>
        <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
        <linearGradient id="pieS1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
        <linearGradient id="pieS2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="pieS3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="expShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#F43F5E" floodOpacity="0.2" />
        </filter>
        <filter id="coinShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#D97706" floodOpacity="0.4" />
        </filter>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Expense Document */}
      <g filter="url(#expShadow)" transform="translate(18, 18)">
        <rect x="0" y="0" width="90" height="118" rx="8" fill="url(#docGrad)" stroke="#FECDD3" strokeWidth="1.5" />
        <rect x="0" y="0" width="90" height="22" rx="8" fill="#F43F5E" />
        <rect x="0" y="14" width="90" height="8" fill="#F43F5E" />
        <text x="45" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="system-ui, sans-serif">EXPENSE</text>
        <rect x="10" y="30" width="50" height="4" rx="2" fill="#FECDD3" />
        <rect x="65" y="30" width="16" height="4" rx="2" fill="#F43F5E" />
        <rect x="10" y="42" width="42" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="10" y="50" width="55" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="10" y="58" width="35" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="10" y="66" width="48" height="3" rx="1.5" fill="#E2E8F0" />
        <line x1="10" y1="78" x2="80" y2="78" stroke="#FECDD3" strokeWidth="1" strokeDasharray="3 2" />
        <rect x="10" y="85" width="30" height="4" rx="2" fill="#CBD5E1" />
        <rect x="55" y="85" width="25" height="4" rx="2" fill="#F43F5E" />
        <circle cx="45" cy="107" r="12" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="2 1" />
        <text x="45" y="109" textAnchor="middle" fill="#10B981" fontSize="6" fontWeight="800" fontFamily="system-ui, sans-serif">PAID</text>
      </g>

      {/* Calculator */}
      <g filter="url(#softShadow)" transform="translate(128, 10)">
        <rect x="0" y="0" width="62" height="90" rx="10" fill="url(#calcGrad)" />
        <rect x="7" y="8" width="48" height="22" rx="5" fill="url(#calcScreen)" />
        <text x="51" y="25" textAnchor="end" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="monospace">8,420</text>
        <rect x="7" y="36" width="12" height="10" rx="3" fill="#64748B" />
        <rect x="21" y="36" width="12" height="10" rx="3" fill="#64748B" />
        <rect x="35" y="36" width="12" height="10" rx="3" fill="#64748B" />
        <rect x="49" y="36" width="12" height="10" rx="3" fill="#F43F5E" />
        <rect x="7" y="49" width="12" height="10" rx="3" fill="#94A3B8" />
        <rect x="21" y="49" width="12" height="10" rx="3" fill="#94A3B8" />
        <rect x="35" y="49" width="12" height="10" rx="3" fill="#94A3B8" />
        <rect x="49" y="49" width="12" height="10" rx="3" fill="#FB923C" />
        <rect x="7" y="62" width="12" height="10" rx="3" fill="#94A3B8" />
        <rect x="21" y="62" width="12" height="10" rx="3" fill="#94A3B8" />
        <rect x="35" y="62" width="12" height="10" rx="3" fill="#94A3B8" />
        <rect x="49" y="62" width="12" height="23" rx="3" fill="#10B981" />
        <rect x="7" y="75" width="26" height="10" rx="3" fill="#94A3B8" />
        <rect x="35" y="75" width="12" height="10" rx="3" fill="#94A3B8" />
      </g>

      {/* Wallet */}
      <g filter="url(#softShadow)" transform="translate(200, 55)">
        <rect x="0" y="0" width="62" height="44" rx="8" fill="url(#walletGrad)" />
        <rect x="0" y="12" width="62" height="3" fill="#6D28D9" />
        <rect x="6" y="18" width="50" height="20" rx="4" fill="#5B21B6" />
        <rect x="12" y="5" width="30" height="14" rx="2" fill="#4ADE80" transform="rotate(-5 12 5)" />
        <rect x="15" y="5" width="24" height="14" rx="2" fill="#22C55E" transform="rotate(-5 15 5)" />
        <ellipse cx="50" cy="10" rx="12" ry="12" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
        <text x="50" y="14" textAnchor="middle" fill="#D97706" fontSize="11" fontWeight="800" fontFamily="system-ui">$</text>
      </g>

      {/* Stacked Gold Coins - tall stack */}
      <g filter="url(#coinShadow)" transform="translate(198, 108)">
        <rect x="2" y="52" width="36" height="8" fill="#F59E0B" />
        <ellipse cx="20" cy="52" rx="18" ry="6" fill="#D97706" />
        <rect x="2" y="44" width="36" height="8" fill="#F59E0B" />
        <ellipse cx="20" cy="44" rx="18" ry="6" fill="#FBBF24" />
        <rect x="2" y="36" width="36" height="8" fill="#F59E0B" />
        <ellipse cx="20" cy="36" rx="18" ry="6" fill="#FBBF24" />
        <rect x="2" y="28" width="36" height="8" fill="#F59E0B" />
        <ellipse cx="20" cy="28" rx="18" ry="6" fill="#FBBF24" />
        <rect x="2" y="20" width="36" height="8" fill="#F59E0B" />
        <ellipse cx="20" cy="20" rx="18" ry="6" fill="#FBBF24" />
        <rect x="2" y="12" width="36" height="8" fill="#F59E0B" />
        <ellipse cx="20" cy="12" rx="18" ry="6" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1" />
        <text x="20" y="16" textAnchor="middle" fill="#D97706" fontSize="9" fontWeight="800">$</text>
      </g>

      {/* Smaller coin stack */}
      <g filter="url(#coinShadow)" transform="translate(238, 130)">
        <rect x="2" y="30" width="28" height="6" fill="#F59E0B" />
        <ellipse cx="16" cy="30" rx="14" ry="5" fill="#D97706" />
        <rect x="2" y="23" width="28" height="7" fill="#F59E0B" />
        <ellipse cx="16" cy="23" rx="14" ry="5" fill="#FBBF24" />
        <rect x="2" y="16" width="28" height="7" fill="#F59E0B" />
        <ellipse cx="16" cy="16" rx="14" ry="5" fill="#FBBF24" />
        <rect x="2" y="9" width="28" height="7" fill="#F59E0B" />
        <ellipse cx="16" cy="9" rx="14" ry="5" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1" />
      </g>

      {/* Pie/Donut chart */}
      <g transform="translate(12, 128)">
        <circle cx="30" cy="30" r="28" fill="#FFF1F2" />
        <path d="M30 30 L30 2 A28 28 0 0 1 54.2 16.2 Z" fill="url(#pieS1)" />
        <path d="M30 30 L54.2 16.2 A28 28 0 0 1 54.2 43.8 Z" fill="url(#pieS2)" />
        <path d="M30 30 L54.2 43.8 A28 28 0 0 1 30 58 Z" fill="url(#pieS3)" />
        <path d="M30 30 L30 58 A28 28 0 0 1 30 2 Z" fill="#F1F5F9" />
        <circle cx="30" cy="30" r="12" fill="white" />
        <text x="30" y="34" textAnchor="middle" fill="#F43F5E" fontSize="8" fontWeight="800">%</text>
      </g>

      {/* Floating badge */}
      <g transform="translate(95, 130)">
        <rect x="0" y="0" width="42" height="22" rx="11" fill="#F43F5E" />
        <text x="21" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="system-ui">&#8593; 12%</text>
      </g>

      {/* Accent sparkles */}
      <circle cx="115" cy="22" r="3" fill="#F43F5E" opacity="0.5" />
      <circle cx="260" cy="48" r="2" fill="#FBBF24" opacity="0.8" />
      <circle cx="78" cy="155" r="2.5" fill="#818CF8" opacity="0.6" />
      <circle cx="195" cy="180" r="2" fill="#10B981" opacity="0.7" />
    </svg>
  );
}

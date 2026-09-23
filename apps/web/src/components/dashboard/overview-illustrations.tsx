import React from "react";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center w-full ${className || ""}`}>
      <svg
        viewBox="0 0 660 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[660px] select-none"
      >
        <defs>
          {/* Filters for glows and soft shadows */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#8B5CF6" floodOpacity="0.5" />
            <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#6D28D9" floodOpacity="0.3" />
          </filter>
          <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#311078" floodOpacity="0.12" />
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#311078" floodOpacity="0.06" />
          </filter>
          <filter id="orbLightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients */}
          <radialGradient id="orbBody" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F7F1FF" />
            <stop offset="80%" stopColor="#E6D3FF" />
            <stop offset="100%" stopColor="#D8B4FE" />
          </radialGradient>
          <linearGradient id="pedestalBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="40%" stopColor="#4C1D95" />
            <stop offset="100%" stopColor="#2E1065" />
          </linearGradient>
          <linearGradient id="ringNeonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
          <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
        </defs>

        {/* Floating Top-Right Pill: Smarter Business Together */}
        <g filter="url(#cardShadow)" transform="translate(425, 12)">
          <rect x="0" y="0" width="128" height="52" rx="14" fill="#FFFFFF" />
          <text
            x="64"
            y="21"
            textAnchor="middle"
            fill="#6D28D9"
            fontSize="12"
            fontWeight="700"
            fontStyle="italic"
            fontFamily="Georgia, 'Times New Roman', serif"
          >
            Smarter
          </text>
          <text
            x="64"
            y="34"
            textAnchor="middle"
            fill="#6D28D9"
            fontSize="12"
            fontWeight="700"
            fontStyle="italic"
            fontFamily="Georgia, 'Times New Roman', serif"
          >
            Business
          </text>
          <text
            x="64"
            y="46"
            textAnchor="middle"
            fill="#6D28D9"
            fontSize="11"
            fontWeight="700"
            fontStyle="italic"
            fontFamily="Georgia, 'Times New Roman', serif"
          >
            Together
          </text>
        </g>

        {/* Far Right Script Text: Ideas Today Growth Tomorrow */}
        <g transform="translate(530, 115)" textAnchor="start">
          <text
            fill="#6D28D9"
            fontSize="14"
            fontWeight="700"
            fontStyle="italic"
            fontFamily="Georgia, cursive, serif"
          >
            Ideas
          </text>
          <text
            y="18"
            fill="#6D28D9"
            fontSize="14"
            fontWeight="700"
            fontStyle="italic"
            fontFamily="Georgia, cursive, serif"
          >
            Today
          </text>
          <text
            y="36"
            fill="#6D28D9"
            fontSize="14"
            fontWeight="700"
            fontStyle="italic"
            fontFamily="Georgia, cursive, serif"
          >
            Growth
          </text>
          <text
            y="54"
            fill="#6D28D9"
            fontSize="14"
            fontWeight="700"
            fontStyle="italic"
            fontFamily="Georgia, cursive, serif"
          >
            Tomorrow
          </text>
          {/* Decorative underline flare */}
          <path d="M-2 64 Q22 70 42 64 T72 66" fill="none" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Main Central Platform & Pedestal */}
        <g transform="translate(350, 248)">
          {/* Soft outer glow under pedestal base */}
          <ellipse cx="0" cy="20" rx="140" ry="35" fill="#C084FC" opacity="0.25" filter="url(#orbLightGlow)" />

          {/* Bottom circular platform shadow */}
          <ellipse cx="0" cy="20" rx="130" ry="30" fill="#2B1066" opacity="0.2" />

          {/* Multi-layered metallic pedestal base */}
          <ellipse cx="0" cy="20" rx="120" ry="28" fill="#3B1578" />
          <path d="M -120 20 C -120 35, 120 35, 120 20 L 110 32 C 110 44, -110 44, -110 32 Z" fill="#2E1065" />
          <ellipse cx="0" cy="14" rx="105" ry="24" fill="url(#pedestalBase)" />

          {/* Glowing Purple LED Ring on Pedestal Base */}
          <ellipse cx="0" cy="14" rx="105" ry="24" fill="none" stroke="#C084FC" strokeWidth="4" filter="url(#neonGlow)" />
          <ellipse cx="0" cy="10" rx="90" ry="20" fill="#4C1D95" />

          {/* Upper metallic cylinder stack */}
          <ellipse cx="0" cy="5" rx="75" ry="16" fill="#6D28D9" />
          <path d="M -75 5 C -75 16, 75 16, 75 5 L 68 14 C 68 22, -68 22, -68 14 Z" fill="#3B1578" />
          <ellipse cx="0" cy="0" rx="68" ry="14" fill="#A855F7" opacity="0.8" />
          <ellipse cx="0" cy="0" rx="65" ry="13" fill="#2E1065" />
          {/* Top bright LED ring */}
          <ellipse cx="0" cy="0" rx="65" ry="13" fill="none" stroke="#38BDF8" strokeWidth="3" filter="url(#neonGlow)" />
        </g>

        {/* Central Orb Network Orbit Lines */}
        <g transform="translate(350, 160)">
          {/* Back Orbiting Line Ring 1 */}
          <ellipse cx="0" cy="0" rx="115" ry="42" fill="none" stroke="#E9D8FF" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8" transform="rotate(-15)" />
          {/* Back Orbiting Line Ring 2 */}
          <ellipse cx="0" cy="0" rx="100" ry="50" fill="none" stroke="#C084FC" strokeWidth="1.5" opacity="0.7" transform="rotate(25)" />
        </g>

        {/* Central VG Orb */}
        <g transform="translate(350, 155)">
          {/* Soft backlight aura */}
          <circle cx="0" cy="0" r="70" fill="#A855F7" opacity="0.35" filter="url(#neonGlow)" />

          {/* Glowing Outer Translucent Ring around Orb */}
          <circle cx="0" cy="0" r="64" fill="none" stroke="url(#ringNeonGrad)" strokeWidth="3.5" filter="url(#neonGlow)" />

          {/* Main 3D Sphere Body */}
          <circle cx="0" cy="0" r="58" fill="url(#orbBody)" filter="url(#cardShadow)" />

          {/* Inner Highlight Ring */}
          <circle cx="0" cy="0" r="56" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />

          {/* Text inside central orb */}
          <text
            x="0"
            y="-8"
            textAnchor="middle"
            fill="#5B21B6"
            fontSize="32"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.5"
          >
            VG
          </text>
          <text
            x="0"
            y="14"
            textAnchor="middle"
            fill="#4C1D95"
            fontSize="15"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            ValGrow
          </text>
          <text
            x="0"
            y="28"
            textAnchor="middle"
            fill="#7C3AED"
            fontSize="8"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="1.5"
          >
            BUSINESS OS
          </text>
        </g>

        {/* Front Orbit Line Ring & Small Node Points */}
        <g transform="translate(350, 155)">
          <ellipse cx="0" cy="0" rx="125" ry="38" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.9" transform="rotate(-8)" />
          {/* Orbital Nodes */}
          <circle cx="-120" cy="14" r="4.5" fill="#38BDF8" filter="url(#neonGlow)" />
          <circle cx="115" cy="-12" r="4.5" fill="#C084FC" filter="url(#neonGlow)" />
          <circle cx="20" cy="38" r="3.5" fill="#F472B6" filter="url(#neonGlow)" />
        </g>

        {/* 5 FLOATING CARDS SURROUNDING THE CENTRAL ORB */}

        {/* Card 1: POS (Top Center) */}
        <g filter="url(#cardShadow)" transform="translate(320, 22)">
          <rect x="0" y="0" width="60" height="58" rx="14" fill="#FFFFFF" />
          {/* Icon Box */}
          <rect x="14" y="8" width="32" height="28" rx="8" fill="#F3E8FF" />
          {/* Store Front Icon */}
          <path d="M21 16 H39 V28 H21 Z" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinejoin="round" />
          <path d="M19 16 L23 11 H37 L41 16" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <rect x="27" y="22" width="6" height="6" fill="#7C3AED" />
          <text x="30" y="49" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="800" fontFamily="sans-serif">
            POS
          </text>
        </g>

        {/* Card 2: Inventory (Left) */}
        <g filter="url(#cardShadow)" transform="translate(200, 110)">
          <rect x="0" y="0" width="70" height="65" rx="14" fill="#FFFFFF" />
          {/* Icon Box */}
          <rect x="17" y="8" width="36" height="32" rx="9" fill="#E0F2FE" />
          {/* 3D Blue Cube Icon */}
          <path d="M35 14 L46 19.5 V30.5 L35 36 L24 30.5 V19.5 Z" fill="#38BDF8" opacity="0.3" />
          <path d="M35 14 L46 19.5 L35 25 L24 19.5 Z" fill="#0284C7" />
          <path d="M24 19.5 L35 25 V36 L24 30.5 Z" fill="#0369A1" />
          <path d="M46 19.5 L35 25 V36 L46 30.5 Z" fill="#38BDF8" />
          <text x="35" y="54" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="800" fontFamily="sans-serif">
            Inventory
          </text>
        </g>

        {/* Card 3: Purchasing (Bottom-Left) */}
        <g filter="url(#cardShadow)" transform="translate(225, 205)">
          <rect x="0" y="0" width="70" height="62" rx="14" fill="#FFFFFF" />
          {/* Icon Box */}
          <rect x="17" y="7" width="36" height="30" rx="9" fill="#DCFCE7" />
          {/* Shopping Cart Icon */}
          <path d="M25 14 H28 L31 26 H41 L43 18 H29" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="30" r="2" fill="#16A34A" />
          <circle cx="39" cy="30" r="2" fill="#16A34A" />
          <text x="35" y="52" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="800" fontFamily="sans-serif">
            Purchasing
          </text>
        </g>

        {/* Card 4: Customers (Right) */}
        <g filter="url(#cardShadow)" transform="translate(440, 118)">
          <rect x="0" y="0" width="68" height="60" rx="14" fill="#FFFFFF" />
          {/* Icon Box */}
          <rect x="17" y="7" width="34" height="30" rx="9" fill="#FFE4E6" />
          {/* User Profile Icon */}
          <circle cx="34" cy="18" r="4" fill="#E11D48" />
          <path d="M26 29 C26 25 29 24 34 24 C39 24 42 25 42 29" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none" />
          <text x="34" y="50" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="800" fontFamily="sans-serif">
            Customers
          </text>
        </g>

        {/* Card 5: Reports (Bottom-Right) - Independent & Uncluttered */}
        <g filter="url(#cardShadow)" transform="translate(445, 205)">
          <rect x="0" y="0" width="68" height="60" rx="14" fill="#FFFFFF" />
          {/* Icon Box */}
          <rect x="17" y="7" width="34" height="30" rx="9" fill="#FEF3C7" />
          {/* Bar Chart Icon */}
          <rect x="23" y="22" width="4" height="9" rx="1" fill="#D97706" />
          <rect x="31" y="16" width="4" height="15" rx="1" fill="#F59E0B" />
          <rect x="39" y="12" width="4" height="19" rx="1" fill="#D97706" />
          <text x="34" y="50" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="800" fontFamily="sans-serif">
            Reports
          </text>
        </g>

        {/* INDEPENDENT FAR-RIGHT GRAPHIC: Potted Plant & 3D Growth Bar Chart */}
        {/* Positioned at x=530 to guarantee clear separation & zero overlap */}
        <g transform="translate(530, 195)">
          {/* Potted Plant */}
          <g transform="translate(0, 15)" filter="url(#cardShadow)">
            <path d="M12 20 C5 5 -5 8 0 -5 C10 5 12 15 12 20 Z" fill="#15803D" />
            <path d="M12 20 C18 0 26 2 24 -10 C18 0 15 15 12 20 Z" fill="#22C55E" />
            <path d="M12 20 C-2 12 -8 20 -12 12 C-2 18 8 19 12 20 Z" fill="#16A34A" />
            <path d="M12 20 C24 12 30 20 34 12 C24 18 16 19 12 20 Z" fill="#4ADE80" />
            {/* White Pot */}
            <path d="M2 20 H22 L19 46 H5 Z" fill="#FFFFFF" />
            <ellipse cx="12" cy="20" rx="10" ry="2.5" fill="#E2E8F0" />
          </g>

          {/* 3D Growth Bar Columns & Upward Purple Arrow */}
          <g transform="translate(35, -5)" filter="url(#cardShadow)">
            {/* Column 1 (Short) */}
            <rect x="0" y="45" width="12" height="25" rx="3" fill="#C084FC" />
            {/* Column 2 (Medium) */}
            <rect x="16" y="30" width="14" height="40" rx="3" fill="url(#barGrad1)" />
            {/* Column 3 (Tall) */}
            <rect x="34" y="10" width="16" height="60" rx="4" fill="url(#barGrad2)" />

            {/* Glowing Arrow pointing up on top of tallest column */}
            <g transform="translate(34, -14)">
              <path d="M8 0 L16 14 H11 V24 H5 V14 H0 Z" fill="#6D28D9" filter="url(#neonGlow)" />
              <path d="M8 2 L14 13 H10 V22 H6 V13 H2 Z" fill="#C084FC" />
            </g>
          </g>
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

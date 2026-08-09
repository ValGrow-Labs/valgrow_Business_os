import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  ShieldCheck,
  KeyRound,
  Settings,
  Bell,
  History,
  Search,
  FolderOpen,
  LifeBuoy,
  UserRound,
  SlidersHorizontal,
  Network,
  UsersRound,
  ScrollText,
  Palette,
  Lock,
  Cpu,
  Component,
  ShoppingCart,
  Boxes,
  Contact,
  Calculator,
  BriefcaseBusiness,
  BarChart3,
  Sparkles,
  Package,
  FolderTree,
  Tag,
  Scale,
  Receipt,
  Warehouse,
  MapPin,
  Barcode,
  ArrowRightLeft,
  Sliders,
  BookmarkCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  soon?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Foundation",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard },
      { title: "Global Search", url: "/search", icon: Search },
      { title: "Components", url: "/components", icon: Component },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Organization", url: "/organization", icon: Building2 },
      { title: "Branches", url: "/branches", icon: GitBranch },
      { title: "Departments", url: "/departments", icon: Network },
      { title: "Teams", url: "/teams", icon: UsersRound },
    ],
  },
  {
    label: "Access",
    items: [
      { title: "Users", url: "/users", icon: Users },
      { title: "Roles", url: "/roles", icon: ShieldCheck },
      { title: "Permissions", url: "/permissions", icon: KeyRound },
    ],
  },
  {
    label: "Master Data",
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Categories", url: "/categories", icon: FolderTree },
      { title: "Brands", url: "/brands", icon: Tag },
      { title: "Units", url: "/units", icon: Scale },
      { title: "Taxes", url: "/taxes", icon: Receipt },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Stock Levels", url: "/inventory", icon: Boxes },
      { title: "Warehouses", url: "/warehouses", icon: Warehouse },
      { title: "Locations", url: "/locations", icon: MapPin },
      { title: "Batches", url: "/batches", icon: Package },
      { title: "Serial Numbers", url: "/serial-numbers", icon: Barcode },
      { title: "Movements", url: "/movements", icon: History },
      { title: "Transfers", url: "/transfers", icon: ArrowRightLeft },
      { title: "Adjustments", url: "/adjustments", icon: Sliders },
      { title: "Reservations", url: "/reservations", icon: BookmarkCheck },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Activity Logs", url: "/activity", icon: History },
      { title: "Audit Logs", url: "/audit-logs", icon: ScrollText },
      { title: "File Manager", url: "/files", icon: FolderOpen },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Profile", url: "/profile", icon: UserRound },
      { title: "Preferences", url: "/preferences", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "System", url: "/settings/system", icon: Cpu },
      { title: "Theme", url: "/settings/theme", icon: Palette },
      { title: "Appearance", url: "/settings/appearance", icon: Settings },
      { title: "Security", url: "/settings/security", icon: Lock },
    ],
  },
  {
    label: "Business modules",
    items: [
      { title: "Projects", url: "/", icon: Boxes, soon: true },
      { title: "Clients", url: "/", icon: Contact, soon: true },
      { title: "Finance", url: "/", icon: Calculator, soon: true },
      { title: "Sales", url: "/", icon: ShoppingCart, soon: true },
      { title: "Operations", url: "/", icon: BriefcaseBusiness, soon: true },
      { title: "AI Workspace", url: "/", icon: Sparkles, soon: true },
      { title: "Analytics", url: "/", icon: BarChart3, soon: true },
      { title: "Automation", url: "/", icon: Cpu, soon: true },
      { title: "Reports", url: "/", icon: ScrollText, soon: true },
    ],
  },
  {
    label: "Support",
    items: [{ title: "Help", url: "/help", icon: LifeBuoy }],
  },
];

export const organizations = [
  { id: "valgrow", name: "ValGrow Holdings", plan: "Enterprise" },
  { id: "northwind", name: "Northwind Retail", plan: "Growth" },
  { id: "helio", name: "Helio Logistics", plan: "Starter" },
];

export const branches = [
  { id: "hq", name: "Head Office", city: "Bengaluru" },
  { id: "north", name: "North Hub", city: "Delhi" },
  { id: "west", name: "West Hub", city: "Mumbai" },
  { id: "south", name: "South Hub", city: "Chennai" },
];

export const notifications = [
  {
    id: "1",
    title: "Role updated",
    body: "The Operations Manager role gained 3 new permissions.",
    time: "2m ago",
    unread: true,
    kind: "info" as const,
  },
  {
    id: "2",
    title: "New member invited",
    body: "An invitation was sent to placeholder@example.com.",
    time: "1h ago",
    unread: true,
    kind: "success" as const,
  },
  {
    id: "3",
    title: "Security review due",
    body: "Quarterly access review for North Hub is pending.",
    time: "Yesterday",
    unread: false,
    kind: "warning" as const,
  },
];

export const primaryNav: { title: string; url: string; soon?: boolean }[] = [
  { title: "Dashboard", url: "/" },
  { title: "Organization", url: "/organization" },
  { title: "Products", url: "/products" },
  { title: "Stock", url: "/inventory" },
  { title: "Analytics", url: "/", soon: true },
  { title: "Reports", url: "/", soon: true },
];

export const searchTargets = navGroups
  .filter((g) => g.label !== "Business modules")
  .flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));

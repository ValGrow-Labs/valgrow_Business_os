import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Calendar,
  CheckCircle2,
  CircleCheck,
  Contact,
  FileText,
  Cpu,
  Database,
  PlayCircle,
  Receipt,
  Share2,
  Sparkles,
  StickyNote,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ModuleHealth = "healthy" | "running" | "review" | "warning" | "offline";

export type ModuleVisual =
  | { kind: "sparkline"; data: number[] }
  | { kind: "bar"; data: number[] }
  | {
      kind: "donut";
      segments: Array<{ label: string; value: number; colorVar: string }>;
    }
  | {
      kind: "avatars";
      people: Array<{ name: string; initials: string }>;
      extra: number;
    }
  | {
      kind: "workflow";
      steps: Array<{ icon: LucideIcon; state: "done" | "active" | "pending" }>;
    };

export type ModuleCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  health: ModuleHealth;
  primaryValue: string;
  primaryLabel: string;
  secondaryValue?: string;
  secondaryLabel?: string;
  trend?: { direction: "up" | "down" | "flat"; delta: string; context: string };
  visual: ModuleVisual;
  updated: string;
  cta: string;
  url: string;
};

export const moduleCards: ModuleCard[] = [
  {
    title: "Projects",
    description: "Track delivery across every active engagement.",
    icon: BriefcaseBusiness,
    health: "healthy",
    primaryValue: "24",
    primaryLabel: "Projects",
    secondaryValue: "67%",
    secondaryLabel: "Completion",
    trend: { direction: "up", delta: "12%", context: "vs last week" },
    visual: { kind: "sparkline", data: [8, 14, 11, 18, 22, 19, 28, 34, 31, 40, 46, 44, 58] },
    updated: "Updated 12 min ago",
    cta: "Open module",
    url: "/",
  },
  {
    title: "Employees",
    description: "Headcount, onboarding and access in one place.",
    icon: Users,
    health: "healthy",
    primaryValue: "312",
    primaryLabel: "Members",
    trend: { direction: "up", delta: "8%", context: "vs last month" },
    visual: {
      kind: "avatars",
      people: [
        { name: "Amara Okafor", initials: "AO" },
        { name: "Priya Nair", initials: "PN" },
        { name: "Dev Patel", initials: "DP" },
        { name: "Sana Sheikh", initials: "SS" },
      ],
      extra: 28,
    },
    updated: "Updated 5 min ago",
    cta: "View directory",
    url: "/users",
  },
  {
    title: "Sales",
    description: "Pipeline health and quota attainment by team.",
    icon: BarChart3,
    health: "review",
    primaryValue: "$482K",
    primaryLabel: "This Quarter",
    trend: { direction: "up", delta: "18%", context: "vs last quarter" },
    visual: { kind: "bar", data: [22, 28, 18, 32, 26, 38, 30, 44, 36, 48, 40, 52] },
    updated: "Updated 1 hour ago",
    cta: "Open module",
    url: "/",
  },
  {
    title: "Finance",
    description: "Cash flow, invoicing and spend at a glance.",
    icon: Calculator,
    health: "review",
    primaryValue: "$1.24M",
    primaryLabel: "Net Revenue",
    trend: { direction: "up", delta: "12%", context: "vs last month" },
    visual: {
      kind: "donut",
      segments: [
        { label: "Revenue", value: 62, colorVar: "var(--primary)" },
        { label: "Expenses", value: 28, colorVar: "var(--warning)" },
        { label: "Profit", value: 10, colorVar: "var(--success)" },
      ],
    },
    updated: "Updated 30 min ago",
    cta: "Open module",
    url: "/",
  },
  {
    title: "Clients",
    description: "Accounts, renewals and satisfaction scores.",
    icon: Contact,
    health: "healthy",
    primaryValue: "148",
    primaryLabel: "Accounts",
    trend: { direction: "up", delta: "6%", context: "vs last month" },
    visual: { kind: "sparkline", data: [30, 33, 29, 36, 40, 38, 45, 43, 50, 54, 58, 62, 68] },
    updated: "Updated 2 hours ago",
    cta: "Open module",
    url: "/",
  },
  {
    title: "Automation",
    description: "Workflows running quietly in the background.",
    icon: Cpu,
    health: "running",
    primaryValue: "37",
    primaryLabel: "Workflows",
    secondaryValue: "99.8%",
    secondaryLabel: "Success Rate",
    visual: {
      kind: "workflow",
      steps: [
        { icon: PlayCircle, state: "done" },
        { icon: Database, state: "done" },
        { icon: Share2, state: "done" },
        { icon: CircleCheck, state: "active" },
      ],
    },
    updated: "Updated just now",
    cta: "Open module",
    url: "/",
  },
];

export const moduleInsights: Array<{
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}> = [
  {
    id: "i1",
    icon: BriefcaseBusiness,
    title: "3 projects are behind schedule",
    subtitle: "Review them now",
  },
  {
    id: "i2",
    icon: Receipt,
    title: "5 invoices are pending payment",
    subtitle: "Total value $84,250",
  },
  {
    id: "i3",
    icon: AlertTriangle,
    title: "2 workflows failed today",
    subtitle: "Check automation logs",
  },
];

export const activityFeed = [
  {
    id: "a1",
    icon: UserPlus,
    text: "Priya Nair invited 2 new members to North Hub",
    time: "12m ago",
  },
  {
    id: "a2",
    icon: CheckCircle2,
    text: "Q3 finance report approved by Alex Verma",
    time: "48m ago",
  },
  {
    id: "a3",
    icon: BriefcaseBusiness,
    text: "“Retail Rollout” project moved to In Review",
    time: "2h ago",
  },
  {
    id: "a4",
    icon: FileText,
    text: "Vendor contract uploaded to Documents",
    time: "5h ago",
  },
];

export const pendingApprovals = [
  { id: "p1", title: "Expense report — Mumbai branch", requester: "Rohan Iyer", time: "Due today" },
  { id: "p2", title: "New vendor onboarding", requester: "Sana Sheikh", time: "Due tomorrow" },
  {
    id: "p3",
    title: "Access request — Finance module",
    requester: "Dev Patel",
    time: "Due in 3 days",
  },
];

export const upcomingMeetings = [
  { id: "m1", title: "Leadership sync", time: "Today · 3:00 PM", attendees: 6 },
  { id: "m2", title: "North Hub QBR", time: "Tomorrow · 11:00 AM", attendees: 9 },
  { id: "m3", title: "Vendor renewal review", time: "Fri · 2:30 PM", attendees: 4 },
];

export const quickNotes = [
  "Follow up with legal on the vendor MSA redline.",
  "Prep talking points for the North Hub QBR.",
  "Review Q3 automation savings before board update.",
];

export const aiSuggestions = [
  {
    id: "s1",
    icon: Sparkles,
    text: "Finance spend is trending 8% under budget — reallocate to hiring?",
  },
  {
    id: "s2",
    icon: Calendar,
    text: "3 pending approvals are older than 48 hours. Nudge approvers?",
  },
  {
    id: "s3",
    icon: StickyNote,
    text: "Client renewal risk detected for 2 accounts in West Hub.",
  },
];

export const recentDocuments = [
  { id: "d1", name: "Q3 Board Deck.pdf", updated: "1h ago" },
  { id: "d2", name: "Vendor MSA — Draft v3.docx", updated: "4h ago" },
  { id: "d3", name: "North Hub Headcount.xlsx", updated: "Yesterday" },
];

export const dashboardTags = [
  "Q3 Planning",
  "North Hub",
  "Automation",
  "Finance",
  "Onboarding",
  "Renewals",
];

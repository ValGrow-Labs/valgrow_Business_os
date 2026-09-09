import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  CircleHelp,
  Crown,
  GitBranch,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationItem } from "@/components/foundation/notification-item";
import { CommandPalette } from "@/components/layout/command-palette";
import { useTheme } from "@/components/theme-provider";
import { branches, navGroups, notifications, organizations, primaryNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import valgrowLogo from "@/assets/valgrow-logo.png";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { useOrganizations } from "@/hooks/queries/useOrganizations";
import { useBranches } from "@/hooks/queries/useBranches";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { useLogoutMutation } from "@/hooks/queries/useAuthMutations";
import { setActiveOrgId } from "@/lib/api-client";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center px-1", compact ? "justify-center" : "gap-2.5")}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-white border border-slate-300 text-slate-900 font-extrabold shadow-2xs",
          compact ? "h-9 w-9 text-xs" : "h-9 w-9 text-xs",
        )}
      >
        VG
      </span>
      {!compact ? (
        <span className="leading-tight truncate">
          <span className="block text-sm font-extrabold text-slate-900">ValGrow</span>
          <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">
            BUSINESS OS
          </span>
        </span>
      ) : null}
    </Link>
  );
}

function PrimaryNavLinks() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {primaryNav.map((item) => {
        const active = !item.soon && pathname === item.url;
        const base = cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        );

        if (item.soon) {
          return (
            <TooltipProvider key={item.title} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span aria-disabled className={cn(base, "cursor-not-allowed opacity-50")}>
                    {item.title}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">{item.title} — coming soon</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return (
          <Link key={item.title} to={item.url} className={base}>
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderIconLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Button asChild variant="ghost" size="icon" aria-label={label}>
      <Link to={to}>
        <Icon className="h-4 w-4" />
      </Link>
    </Button>
  );
}

function SidebarNav({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <ScrollArea className="h-full">
      <nav className="space-y-5 p-3">
        {navGroups.map((group, idx) => (
          <div key={group.label || idx} className="space-y-1">
            {!compact && group.label ? (
              <p className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                {group.label}
              </p>
            ) : compact && group.label ? (
              <Separator className="mx-auto my-2 w-6" />
            ) : null}
            {group.items.map((item) => {
              const active = !item.soon && pathname === item.url;
              const content = (
                <>
                  <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-purple-700" : "text-slate-500")} />
                  {!compact ? <span className="truncate">{item.title}</span> : null}
                </>
              );
              const base = cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                compact && "justify-center",
                active
                  ? "bg-purple-100/80 text-purple-900 font-semibold"
                  : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900",
              );

              return (
                <Link key={item.title} to={item.url} className={base} onClick={onNavigate}>
                  {content}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}

function OrgSwitcher() {
  const { data: userMe } = useCurrentUser();
  const { data: apiOrgs } = useOrganizations();
  const orgList = apiOrgs && apiOrgs.length > 0 ? apiOrgs : organizations;

  const currentOrg = userMe?.activeOrganization
    ? orgList.find((o) => o.id === userMe.activeOrganization?.id) || userMe.activeOrganization
    : orgList[0]!;

  const handleSelect = (orgId: string) => {
    setActiveOrgId(orgId);
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 justify-between gap-2 px-2.5 shrink-0">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate text-sm font-medium">{currentOrg.name}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {orgList.map((o) => (
          <DropdownMenuItem key={o.id} onClick={() => handleSelect(o.id)} className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="flex-1 truncate">{o.name}</span>
            <span className="text-xs text-muted-foreground">{o.plan}</span>
            {o.id === currentOrg.id ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/organization">Organization settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BranchSwitcher() {
  const { data: apiBranches } = useBranches();
  const branchList = apiBranches && apiBranches.length > 0 ? apiBranches : branches;
  const [selected, setSelected] = useState(branchList[0]!.id);
  const current = branchList.find((b) => b.id === selected) || branchList[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 justify-between gap-2 px-2.5 shrink-0">
          <GitBranch className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate text-sm font-medium">{current.name}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Branches</DropdownMenuLabel>
        {branchList.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => setSelected(b.id)} className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="flex-1 truncate">{b.name}</span>
            <span className="text-xs text-muted-foreground">{b.city}</span>
            {b.id === current.id ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/branches">Manage branches</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const { data: apiNotifications } = useNotifications();
  const list =
    apiNotifications && apiNotifications.length > 0
      ? apiNotifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        time: new Date(n.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        unread: n.unread,
        kind: (n.kind.toLowerCase() === "error" ? "warning" : n.kind.toLowerCase()) as
          "info" | "success" | "warning",
      }))
      : notifications;

  const unread = list.filter((n) => n.unread).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#5B21B6] text-[10px] font-bold text-white shadow-2xs">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Badge variant="secondary">{unread} new</Badge>
        </div>
        <div className="max-h-80 space-y-1 overflow-y-auto p-2">
          {list.map((n) => (
            <NotificationItem key={n.id} {...n} />
          ))}
        </div>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/notifications">Open notification center</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThemeSwitcher() {
  const { resolved, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className="shrink-0"
    >
      {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function UserMenu() {
  const { data: userMe } = useCurrentUser();
  const logoutMutation = useLogoutMutation();

  const fullName = "John Doe";
  const initials = "JD";
  const roleName = "Admin";

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-90 cursor-pointer"
        >
          <div className="h-9 w-9 rounded-full bg-[#4C1D95] text-white flex items-center justify-center shrink-0 font-semibold text-xs shadow-xs">
            <span>{initials}</span>
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <span className="block text-xs font-bold text-slate-900">{fullName}</span>
            <span className="block text-[10px] font-medium text-slate-500">{roleName}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">{fullName}</p>
          <p className="text-xs text-muted-foreground">{roleName}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/preferences">
            <Settings className="mr-2 h-4 w-4" /> Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  children,
  rightPanel,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  const [compact, setCompact] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative isolate h-screen w-full overflow-hidden bg-slate-50 p-0 sm:p-2 lg:p-3">
      <div className="mx-auto flex h-full w-full max-w-[1720px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <aside
          className={cn(
            "hidden h-full shrink-0 flex-col border-r border-slate-200/80 bg-[#FAFAFC] transition-[width] duration-200 lg:flex",
            compact ? "w-[100px]" : "w-60",
          )}
        >
          {compact ? (
            <div className="relative flex h-[64px] w-full items-center px-3 border-b border-slate-200/80">
              <Brand compact />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCompact((c) => !c)}
                aria-label="Expand sidebar"
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 shrink-0 hover:bg-slate-100"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex h-16 w-full items-center justify-between px-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <Brand />
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                  aria-label="App switcher"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCompact((c) => !c)}
                aria-label="Collapse sidebar"
                className="shrink-0 hover:bg-slate-100"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <SidebarNav compact={compact} />
          </div>
          <div className="p-3">
            {compact ? (
              <div className="flex items-center justify-center rounded-xl bg-purple-100 p-2.5 text-purple-700">
                <Crown className="h-4 w-4" />
              </div>
            ) : (
              <div className="rounded-2xl border border-purple-100/80 bg-[#FAF7FF] p-3.5 text-center">
                <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                  <Crown className="h-3.5 w-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">You are on</p>
                <p className="text-xs font-bold text-slate-900">Free Plan</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2.5 w-full h-8 border-purple-200 bg-white text-[11px] font-semibold text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-2xs"
                >
                  Upgrade Plan <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col h-full bg-white">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6">
            {/* Left Header Title & Mobile menu */}
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden shrink-0"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5 text-slate-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-sidebar p-0">
                  <SheetTitle className="px-4 pt-4">
                    <Brand />
                  </SheetTitle>
                  <div className="h-[calc(100vh-5rem)]">
                    <SidebarNav compact={false} onNavigate={() => setMobileOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>

              <button
                onClick={() => setCompact((c) => !c)}
                className="hidden lg:flex items-center justify-center p-1 text-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Toggle Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-base font-bold text-slate-900 hidden sm:block">Overview</h1>
            </div>

            {/* Right-side controls */}
            <div className="flex shrink-0 items-center gap-3">
              <NotificationBell />
              <BranchSwitcher />
              <UserMenu />
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div
              className={cn(
                "mx-auto w-full",
                rightPanel ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]" : "max-w-7xl",
              )}
            >
              <div className="min-w-0 space-y-6">{children}</div>
              {rightPanel ? <div className="space-y-4">{rightPanel}</div> : null}
            </div>
          </main>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </div>
  );
}

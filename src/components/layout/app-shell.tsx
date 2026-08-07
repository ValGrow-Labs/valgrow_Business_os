import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  CircleHelp,
  GitBranch,
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

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center px-1", compact ? "justify-center" : "gap-3.5")}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5",
          compact ? "h-9 w-9" : "h-[50px] w-[50px]",
        )}
      >
        <img
          src={valgrowLogo}
          alt="ValGrow"
          className={cn("object-contain", compact ? "h-[24px] w-[24px]" : "h-[34px] w-[34px]")}
        />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-sm font-bold">ValGrow</span>
          <span className="block text-[11px] uppercase tracking-widest text-muted-foreground">
            Business OS
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
      <nav className="space-y-6 p-3">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!compact ? (
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {group.label}
              </p>
            ) : (
              <Separator className="mx-auto my-2 w-6" />
            )}
            {group.items.map((item) => {
              const active = !item.soon && pathname === item.url;
              const content = (
                <>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!compact ? <span className="truncate">{item.title}</span> : null}
                  {!compact && item.soon ? (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      Soon
                    </Badge>
                  ) : null}
                </>
              );
              const base = cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                compact && "justify-center",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              );

              if (item.soon) {
                return (
                  <TooltipProvider key={item.title} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          aria-disabled
                          className={cn(base, "cursor-not-allowed opacity-50 hover:bg-transparent")}
                        >
                          {content}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.title} — coming soon</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

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
  const [selected, setSelected] = useState(organizations[0]!.id);
  const current = organizations.find((o) => o.id === selected)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 justify-between gap-2 px-2.5 sm:min-w-48">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="hidden truncate sm:inline">{current.name}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {organizations.map((o) => (
          <DropdownMenuItem key={o.id} onClick={() => setSelected(o.id)} className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="flex-1 truncate">{o.name}</span>
            <span className="text-xs text-muted-foreground">{o.plan}</span>
            {o.id === selected ? <Check className="h-4 w-4 text-primary" /> : null}
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
  const [selected, setSelected] = useState(branches[0]!.id);
  const current = branches.find((b) => b.id === selected)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 justify-between gap-2 px-2.5 sm:min-w-40">
          <GitBranch className="h-4 w-4 text-primary" />
          <span className="hidden truncate sm:inline">{current.name}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Branches</DropdownMenuLabel>
        {branches.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => setSelected(b.id)} className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="flex-1 truncate">{b.name}</span>
            <span className="text-xs text-muted-foreground">{b.city}</span>
            {b.id === selected ? <Check className="h-4 w-4 text-primary" /> : null}
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
  const unread = notifications.filter((n) => n.unread).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
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
          {notifications.map((n) => (
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
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2.5">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              AV
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline">Alex Verma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">Alex Verma</p>
          <p className="text-xs text-muted-foreground">Workspace owner</p>
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
        <DropdownMenuItem asChild>
          <Link to="/login">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Link>
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
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-background p-2 sm:p-4 lg:p-6">
      <div className="gradient-brand pointer-events-none fixed -left-24 -top-24 -z-10 h-96 w-96 rounded-full opacity-20 blur-[110px]" />
      <div className="pointer-events-none fixed -right-20 top-1/3 -z-10 h-80 w-80 rounded-full bg-warning/20 opacity-25 blur-[110px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-info/20 opacity-20 blur-[110px]" />

      <div className="mx-auto flex h-[calc(100vh-1rem)] w-full max-w-[1680px] overflow-hidden rounded-3xl border border-border bg-background shadow-[var(--shadow-panel)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)]">
        <aside
          className={cn(
            "hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
            compact ? "w-[68px]" : "w-64",
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center gap-3 px-3 border-b border-sidebar-border",
              compact ? "justify-end" : "justify-between",
            )}
          >
            {!compact ? <Brand /> : <Brand compact />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCompact((c) => !c)}
              aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            >
              {compact ? <Menu className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
          <div className="min-h-0 flex-1">
            <SidebarNav compact={compact} />
          </div>
          <div className="p-3">
            {compact ? (
              <div className="gradient-brand flex items-center justify-center rounded-xl p-2.5">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            ) : (
              <div className="gradient-brand relative overflow-hidden rounded-2xl p-4 shadow-[var(--shadow-panel)]">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
                <p className="mt-2 text-sm font-semibold text-primary-foreground">AI Assistant</p>
                <p className="mt-1 text-[11px] leading-relaxed text-primary-foreground/85">
                  Ask questions across every module, in plain language.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full bg-white/15 text-primary-foreground hover:bg-white/25"
                  onClick={() => setPaletteOpen(true)}
                >
                  Open assistant
                </Button>
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/70 px-4 backdrop-blur sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-4 w-4" />
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

            <div className="hidden items-center gap-6 lg:flex">
              <PrimaryNavLinks />
            </div>

            <button
              onClick={() => setPaletteOpen(true)}
              className="mx-auto flex h-10 w-full max-w-2xl items-center gap-3 rounded-xl border border-input bg-surface-2/60 px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="grow truncate whitespace-nowrap text-sm text-muted-foreground">
                Search modules, people, reports...
              </span>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              <HeaderIconLink to="/help" label="Help" icon={CircleHelp} />
              <HeaderIconLink to="/settings/system" label="Settings" icon={Settings} />
              <ThemeSwitcher />
              <NotificationBell />
              <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
              <div className="hidden items-center gap-2 md:flex">
                <OrgSwitcher />
                <BranchSwitcher />
              </div>
              <UserMenu />
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto px-3 py-6 sm:px-6 lg:px-8">
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

          <footer className="shrink-0 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>ValGrow Business OS</span>
              <span>Placeholder content only · v0.1.0</span>
            </div>
          </footer>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </div>
  );
}

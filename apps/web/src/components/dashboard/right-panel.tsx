import type { ComponentType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Calendar, CheckSquare, FileText, Sparkles, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  activityFeed,
  aiSuggestions,
  dashboardTags,
  pendingApprovals,
  quickNotes,
  recentDocuments,
  upcomingMeetings,
} from "@/lib/dashboard-data";

function Widget({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="text-sm font-semibold">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function RightPanel() {
  return (
    <div className="space-y-4">
      <Widget title="Recent activity" icon={Bell}>
        <ul className="space-y-3">
          {activityFeed.map((a) => (
            <li key={a.id} className="flex gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <a.icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs leading-snug text-foreground/90">{a.text}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {a.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget
        title="Pending approvals"
        icon={CheckSquare}
        action={<Badge variant="secondary">{pendingApprovals.length}</Badge>}
      >
        <ul className="space-y-2.5">
          {pendingApprovals.map((p) => (
            <li key={p.id} className="rounded-lg border border-border/70 p-2.5">
              <p className="text-xs font-medium leading-snug">{p.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{p.requester}</span>
                <span className="text-[10px] font-semibold text-warning">{p.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="Upcoming meetings" icon={Calendar}>
        <ul className="space-y-2.5">
          {upcomingMeetings.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{m.title}</p>
                <p className="text-[10px] text-muted-foreground">{m.time}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {m.attendees}
              </Badge>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="Quick notes" icon={StickyNote}>
        <ul className="space-y-2">
          {quickNotes.map((n, i) => (
            <li key={i} className="text-xs leading-relaxed text-muted-foreground">
              • {n}
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="AI suggestions" icon={Sparkles}>
        <ul className="space-y-3">
          {aiSuggestions.map((s) => (
            <li key={s.id} className="rounded-lg bg-primary/8 p-2.5">
              <p className="text-xs leading-relaxed text-foreground/90">{s.text}</p>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget
        title="Recent documents"
        icon={FileText}
        action={
          <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]">
            <Link to="/files">All</Link>
          </Button>
        }
      >
        <ul className="space-y-2.5">
          {recentDocuments.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-foreground/90">{d.name}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{d.updated}</span>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="Tags" icon={CheckSquare}>
        <div className="flex flex-wrap gap-1.5">
          {dashboardTags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] font-normal">
              {t}
            </Badge>
          ))}
        </div>
      </Widget>
    </div>
  );
}

import { Bell, CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  info: Bell,
  success: CheckCircle2,
  warning: TriangleAlert,
};

export function NotificationItem({
  title,
  body,
  time,
  unread,
  kind = "info",
}: {
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  kind?: keyof typeof icons;
}) {
  const Icon = icons[kind];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent/60",
        unread && "bg-accent/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          kind === "success" && "bg-success/15 text-success",
          kind === "warning" && "bg-warning/15 text-warning",
          kind === "info" && "bg-primary/15 text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          {unread ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
        </div>
        <p className="text-xs text-muted-foreground">{body}</p>
        <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground/70">{time}</p>
      </div>
    </div>
  );
}
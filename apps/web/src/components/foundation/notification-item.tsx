import { Bell, CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  info: Bell,
  success: CheckCircle2,
  warning: TriangleAlert,
};

export function NotificationItem({
  id,
  title,
  body,
  time,
  unread,
  kind = "info",
  onClick,
}: {
  id?: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  kind?: keyof typeof icons;
  onClick?: () => void;
}) {
  const Icon = icons[kind];

  return (
    <button
      type="button"
      data-notification-id={id}
      onClick={onClick}
      className={cn(
        "group flex w-full gap-3 rounded-md p-2.5 text-left transition-colors cursor-pointer",
        "hover:bg-accent/80 active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        unread && "bg-primary-soft/40 hover:bg-primary-soft/60",
      )}
      aria-label={`${unread ? "Unread notification: " : ""}${title}. ${body}`}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105",
          kind === "success" && "bg-success-soft text-success",
          kind === "warning" && "bg-warning-soft text-warning",
          kind === "info" && "bg-primary-soft text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">
            {title}
          </p>
          {unread ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ring-1 ring-background"
              aria-label="Unread indicator"
            />
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{body}</p>
        <p className="tabular mt-1 text-[11px] text-muted-foreground/80">{time}</p>
      </div>
    </button>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

function labelize(segment: string) {
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
        ValGrow OS
      </Link>
      {segments.map((segment, i) => (
        <span key={`${segment}-${i}`} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className={i === segments.length - 1 ? "font-medium text-foreground" : undefined}>
            {labelize(segment)}
          </span>
        </span>
      ))}
    </nav>
  );
}

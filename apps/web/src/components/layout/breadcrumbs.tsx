import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

const ACRONYMS: Record<string, string> = { pos: "POS", crm: "CRM" };

function labelize(segment: string) {
  if (ACRONYMS[segment]) return ACRONYMS[segment];
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
      <Link
        to="/dashboard"
        className={
          segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")
            ? "truncate font-medium text-foreground"
            : "hidden shrink-0 text-muted-foreground transition-colors hover:text-foreground sm:inline"
        }
      >
        Dashboard
      </Link>
      {segments
        .filter((s) => s !== "dashboard")
        .map((segment, i, arr) => {
          const last = i === arr.length - 1;
          return (
            <span
              key={`${segment}-${i}`}
              className={last ? "flex min-w-0 items-center gap-1" : "hidden items-center gap-1 sm:flex"}
            >
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 sm:block" />
              <span className={last ? "truncate font-medium text-foreground" : "text-muted-foreground"}>
                {labelize(segment)}
              </span>
            </span>
          );
        })}
    </nav>
  );
}

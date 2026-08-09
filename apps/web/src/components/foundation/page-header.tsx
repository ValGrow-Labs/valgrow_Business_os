import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="space-y-4">
      <Breadcrumbs />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          {eyebrow ? (
            <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

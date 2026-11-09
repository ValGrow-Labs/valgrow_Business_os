import type { ReactNode } from "react";
import { PageGuideButton } from "@/components/onboarding/page-guide";
import type { PageGuideId } from "@/lib/onboarding-content";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  guide,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  /** Adds a "How this works" panel for this page. */
  guide?: PageGuideId;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1 flex-1">
        {eyebrow ? <p className="text-xs font-medium text-primary">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions || guide ? (
        <div className="flex items-center gap-2 shrink-0 sm:self-start">
          {guide ? <PageGuideButton id={guide} /> : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}

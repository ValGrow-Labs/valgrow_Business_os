import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Workflow } from "lucide-react";

const highlights = [
  { icon: Workflow, text: "One shared layout for every future module" },
  { icon: ShieldCheck, text: "Role and permission ready foundation" },
  { icon: Sparkles, text: "AI-first workspace, built to extend" },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="gradient-brand pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl" />
        <div className="gradient-brand pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full opacity-20 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-3">
          <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl font-bold text-primary-foreground">
            V
          </span>
          <span className="leading-tight">
            <span className="block font-bold">ValGrow</span>
            <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Business OS
            </span>
          </span>
        </Link>
        <div className="relative max-w-md space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            The <span className="text-gradient-brand">AI-first</span> operating system for your
            business.
          </h2>
          <p className="text-sm text-muted-foreground">
            This is the foundation workspace — layouts, navigation and shared components that every
            future module plugs into.
          </p>
          <ul className="space-y-3">
            {highlights.map((h) => (
              <li key={h.text} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <h.icon className="h-4 w-4" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">
          Placeholder content · no authentication logic
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl font-bold text-primary-foreground">
              V
            </span>
            <span className="font-bold">ValGrow Business OS</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer ? <div className="text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

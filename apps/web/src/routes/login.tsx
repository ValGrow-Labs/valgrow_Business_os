import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useLoginMutation } from "@/hooks/queries/useAuthMutations";

const description = "Sign in to the ValGrow Business OS foundation workspace.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Log in · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("alex.verma@valgrow.dev");
  const [password, setPassword] = useState("DevelopmentPass123!");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loginMutation = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate({ to: "/" });
        },
        onError: (err: any) => {
          setErrorMsg(err?.message || "Invalid credentials. Please try again.");
        },
      },
    );
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your ValGrow Business OS organization workspace."
      footer={
        <>
          New to ValGrow?{" "}
          <Link to="/" className="font-medium text-primary hover:underline">
            Explore the foundation
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMsg ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive-soft p-3 text-[13px] text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Work email or Login ID</Label>
          <Input
            id="email"
            type="text"
            placeholder="you@company.com or Login ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox id="remember" defaultChecked />
          Keep me signed in on this device
        </label>
        <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
        <Button type="button" variant="outline" size="lg" className="w-full">
          Continue with SSO
        </Button>

        {/* Development Quick Accounts Helper */}
        <div className="mt-4 rounded-lg border border-dashed border-border/80 bg-surface-2/50 p-3 text-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="font-medium">Test Accounts Quick Fill</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold">Dev</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className="flex items-center justify-between rounded px-2 py-1.5 text-left transition hover:bg-surface border bg-surface/70"
              onClick={() => {
                setEmail("salesperson1");
                setPassword("DevelopmentPass123!");
                setErrorMsg(null);
              }}
            >
              <span className="font-medium text-foreground">Salesperson</span>
              <span className="font-mono text-[10px] text-muted-foreground">salesperson1</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-between rounded px-2 py-1.5 text-left transition hover:bg-surface border bg-surface/70"
              onClick={() => {
                setEmail("billing1");
                setPassword("DevelopmentPass123!");
                setErrorMsg(null);
              }}
            >
              <span className="font-medium text-foreground">Billing Staff</span>
              <span className="font-mono text-[10px] text-muted-foreground">billing1</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-between rounded px-2 py-1.5 text-left transition hover:bg-surface border bg-surface/70"
              onClick={() => {
                setEmail("cashier1");
                setPassword("DevelopmentPass123!");
                setErrorMsg(null);
              }}
            >
              <span className="font-medium text-foreground">Cashier</span>
              <span className="font-mono text-[10px] text-muted-foreground">cashier1</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-between rounded px-2 py-1.5 text-left transition hover:bg-surface border bg-surface/70"
              onClick={() => {
                setEmail("alex.verma@valgrow.dev");
                setPassword("DevelopmentPass123!");
                setErrorMsg(null);
              }}
            >
              <span className="font-medium text-foreground">Owner</span>
              <span className="font-mono text-[10px] text-muted-foreground">alex.verma</span>
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

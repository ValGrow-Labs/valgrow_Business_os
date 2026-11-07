import { useState, useEffect, useRef } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoginMutation } from "@/hooks/queries/useAuthMutations";

const description = "Sign in to the ValGrow Business OS foundation workspace.";

interface LoginSearchParams {
  error?: string | undefined;
  message?: string | undefined;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearchParams => ({
    error: typeof search["error"] === "string" ? (search["error"] as string) : undefined,
    message: typeof search["message"] === "string" ? (search["message"] as string) : undefined,
  }),
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
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const loginMutation = useLoginMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (search?.error) {
      switch (search.error) {
        case "inactive_account":
          setErrorMsg(
            "Your ValGrow account is not active. Please contact your organization administrator.",
          );
          break;
        case "no_organization":
          setErrorMsg(
            "Your account is not associated with any active organization workspace.",
          );
          break;
        default:
          setErrorMsg(decodeURIComponent(search.error));
          break;
      }
    }
  }, [search?.error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate({ to: "/dashboard" });
        },
        onError: (err: any) => {
          setErrorMsg(err?.message || "Invalid credentials. Please try again.");
        },
      },
    );
  };

  const handleContinueWithEmail = () => {
    setErrorMsg(null);
    if (!email.trim()) {
      emailInputRef.current?.focus();
      return;
    }
    if (!password) {
      passwordInputRef.current?.focus();
      return;
    }

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate({ to: "/dashboard" });
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
            <span className="flex-1 leading-snug">{errorMsg}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Work email or Login ID</Label>
          <Input
            ref={emailInputRef}
            id="email"
            type="text"
            placeholder="you@company.com or Login ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
            required
            autoComplete="username"
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
          <div className="relative">
            <Input
              ref={passwordInputRef}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 pr-10"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox id="remember" defaultChecked />
          <span>Keep me signed in on this device</span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full h-11 font-medium"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleContinueWithEmail}
          disabled={loginMutation.isPending}
          className="w-full h-11 font-medium gap-2 border-border/80 bg-white text-zinc-800 shadow-xs hover:bg-neutral-50 active:bg-neutral-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>Continue with Email</span>
        </Button>
      </form>
    </AuthLayout>
  );
}

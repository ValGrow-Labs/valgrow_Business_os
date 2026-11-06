import { useState, useEffect } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useLoginMutation } from "@/hooks/queries/useAuthMutations";
import { resolveApiUrl } from "@/lib/api-client";

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

  const loginMutation = useLoginMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (search?.error) {
      switch (search.error) {
        case "google_not_configured":
          setErrorMsg(
            "Google Sign-In is not configured yet. The workspace administrator must configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment variables.",
          );
          break;
        case "cancelled":
        case "access_denied":
          setErrorMsg(
            "Google sign-in was cancelled or access was denied. Please try again or sign in with your work email.",
          );
          break;
        case "account_not_found":
          setErrorMsg(
            "No ValGrow account found for this Google email address. Please sign in with your work email or contact your administrator.",
          );
          break;
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
        case "google_token_exchange_failed":
          setErrorMsg("Failed to complete Google authentication. Please try again.");
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

  const handleGoogleSignIn = () => {
    setErrorMsg(null);
    window.location.href = resolveApiUrl("/auth/google");
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

        <div className="flex items-center gap-3 py-1">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
          <Separator className="flex-1" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border/80 bg-white px-4 text-sm font-medium text-zinc-800 shadow-xs transition-colors hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </form>
    </AuthLayout>
  );
}

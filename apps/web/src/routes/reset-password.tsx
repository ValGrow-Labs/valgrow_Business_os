import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";

const description = "Choose a new password for your ValGrow workspace account.";

interface ResetPasswordSearchParams {
  token?: string | undefined;
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearchParams => ({
    token: typeof search["token"] === "string" ? (search["token"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset password · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Reset password · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const token = search.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("Missing reset token. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      setIsSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => {
        navigate({
          to: "/login",
          search: { message: "Password updated successfully. Please log in with your new password." },
        });
      }, 2000);
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Invalid or expired reset token. Please request a new password reset link.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="No reset token was provided in the URL."
        footer={
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to log in
          </Link>
        }
      >
        <Alert variant="destructive" className="space-y-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">Missing Reset Token</AlertTitle>
          <AlertDescription className="text-xs">
            This reset link is missing its authorization token. Please ask your workspace Owner to generate a new reset link or request one via the forgot password flow.
          </AlertDescription>
        </Alert>

        <div className="pt-2">
          <Button asChild variant="outline" className="w-full text-xs">
            <Link to="/forgot-password">Request reset link</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="Your password has been changed successfully."
        footer={
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Proceed to log in
          </Link>
        }
      >
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-xs text-muted-foreground">
            All previous sessions have been revoked. Redirecting to the sign-in page…
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a secure password for your ValGrow account."
      footer={
        <>
          Remember your password?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMsg && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 pr-10 text-xs"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Use at least 8 characters with letters and numbers.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-10 text-xs"
            required
            minLength={8}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-11 font-medium gap-2 text-xs"
          disabled={isSubmitting || !password || !confirmPassword}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password…
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              Update password
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

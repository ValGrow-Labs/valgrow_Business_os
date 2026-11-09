import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck, Loader2, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const description = "Request a password reset link for your ValGrow workspace account.";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Forgot password · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient<{ message: string; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      toast.success("Request received. Check your email for password reset instructions.");
    } catch {
      // Always show generic message to prevent email enumeration
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your work email and we'll send a password reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      {submitted ? (
        <div className="space-y-4">
          <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
            <MailCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Reset Instructions Sent
            </AlertTitle>
            <AlertDescription className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
              If an active account exists for <span className="font-medium text-foreground">{email}</span>, a secure password reset link has been dispatched.
            </AlertDescription>
          </Alert>

          {resetToken && (
            <div className="pt-2">
              <Button asChild size="sm" variant="outline" className="w-full text-xs gap-1.5">
                <Link to="/reset-password" search={{ token: resetToken }}>
                  Proceed to Reset Screen
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          <div className="pt-2">
            <Button asChild variant="ghost" size="sm" className="w-full text-xs">
              <Link to="/login">Return to Sign In</Link>
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@valgrow.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-xs"
            />
          </div>
          <Button type="submit" size="lg" className="w-full h-11 text-xs font-medium" disabled={isSubmitting || !email}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending link…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

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
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Presentation-only sign in screen — no authentication is performed."
      footer={
        <>
          New to ValGrow?{" "}
          <Link to="/" className="font-semibold text-primary hover:underline">
            Explore the foundation
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="off" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox id="remember" />
          Keep me signed in on this device
        </label>
        <Button type="submit" className="w-full">
          Continue
        </Button>
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
        <Button type="button" variant="outline" className="w-full">
          Continue with SSO
        </Button>
      </form>
    </AuthLayout>
  );
}
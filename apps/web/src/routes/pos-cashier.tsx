import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { CashierCounter } from "@/components/pos/cashier-counter";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/pos-cashier")({
  head: () => ({
    meta: [
      { title: "POS Cashier Counter · ValGrow Business OS" },
      {
        name: "description",
        content:
          "Collect payments, print receipts, and reconcile register floats for verified customer bills.",
      },
    ],
  }),
  component: POSCashierPage,
});

function POSCashierPage() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const isOwner = currentUser?.role?.name === "Owner";
  const permissions = currentUser?.permissions || [];
  const canAccess =
    isOwner || permissions.includes("pos.cashier") || permissions.includes("pos.checkout");

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
          Checking access permissions…
        </div>
      </AppShell>
    );
  }

  if (!canAccess) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Access Restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission (<span className="font-mono text-xs">pos.cashier</span> or{" "}
            <span className="font-mono text-xs">pos.checkout</span>) to access the Cashier Counter.
            Please contact your organization administrator to update your role.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="outline">
              <Link to="/pos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to POS Terminal
              </Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell fullBleed>
      <CashierCounter />
    </AppShell>
  );
}

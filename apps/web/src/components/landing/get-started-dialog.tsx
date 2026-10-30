import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Sparkles,
  Store,
  User,
  ArrowRight,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GetStartedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlan?: string;
}

export function GetStartedDialog({
  open,
  onOpenChange,
  defaultPlan = "Enterprise",
}: GetStartedDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [businessType, setBusinessType] = useState("retail");
  const [branches, setBranches] = useState("1-3");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-card border-border/80 shadow-2xl">
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/40">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              ValGrow Business OS
            </span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {submitted ? "You're All Set!" : "Transform Your Business Operations"}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
            {submitted
              ? "Thank you for reaching out. A ValGrow product specialist will connect with you within 2 business hours."
              : "Experience the unified Business OS for POS, Inventory, Multi-Branch & Real-time Accounting."}
          </DialogDescription>
        </div>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="space-y-6 text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">
                  Request Received for {company || "Your Enterprise"}
                </h4>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  We have queued an onboarding walkthrough customized for{" "}
                  <span className="font-medium text-foreground capitalize">
                    {businessType} operations
                  </span>{" "}
                  with {branches} locations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-border/60 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Want to explore immediately?</span>
                  <span className="font-semibold text-primary">Live Demo Available</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can jump right into our active preview organization and test POS billing,
                  warehouse management, and analytics with pre-loaded sample data.
                </p>
                <div className="pt-2">
                  <Button asChild className="w-full" size="sm">
                    <Link to="/login">
                      Enter Foundation Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleReset}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gs-name" className="text-xs font-medium">
                    Your Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gs-name"
                      required
                      placeholder="Alex Verma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gs-email" className="text-xs font-medium">
                    Work Email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gs-email"
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gs-company" className="text-xs font-medium">
                    Company / Brand Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gs-company"
                      placeholder="Northwind Retail"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gs-type" className="text-xs font-medium">
                    Primary Business Model
                  </Label>
                  <select
                    id="gs-type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                  >
                    <option value="retail">Retail Store & Boutique</option>
                    <option value="supermarket">Supermarket & Grocery</option>
                    <option value="wholesale">Wholesale & Distribution</option>
                    <option value="multi-branch">Multi-Branch Chain</option>
                    <option value="manufacturing">Manufacturing & Assembly</option>
                    <option value="sme">Growing SME</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gs-branches" className="text-xs font-medium">
                  Number of Stores / Warehouses
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {["1 Store", "2-5", "6-15", "15+ (Enterprise)"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBranches(b)}
                      className={`py-2 px-1 text-xs rounded-lg border font-medium transition-all ${
                        branches === b
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border/60 hover:bg-surface-2 text-muted-foreground"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" size="lg" className="w-full font-medium shadow-md">
                  Request Platform Access & Walkthrough
                </Button>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  Enterprise Data Isolation
                </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Already have access? Sign In →
                </Link>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

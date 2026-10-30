import { ArrowRight, CheckCircle2, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingCtaProps {
  onGetStartedClick: () => void;
}

export function LandingCta({ onGetStartedClick }: LandingCtaProps) {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/15 via-surface to-surface p-8 sm:p-12 md:p-16 text-center space-y-8 shadow-2xl overflow-hidden">
          {/* Ambient decorative glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/25 rounded-full blur-3xl -z-10"
          />

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade Your Infrastructure
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              Your Business Deserves a{" "}
              <span className="text-gradient-brand">Better Operating System.</span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Bring your business operations together with ValGrow Business OS. Streamline point of
              sale, warehouse inventory, procurement, and accounting in one intelligent system.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              size="lg"
              onClick={onGetStartedClick}
              className="w-full sm:w-auto h-12 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Today
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onGetStartedClick}
              className="w-full sm:w-auto h-12 px-8 text-base font-medium bg-surface hover:bg-surface-2 transition-all"
            >
              <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground" />
              Contact Us
            </Button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Instant Sandbox Access Available
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              No Hardware Lock-in
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Enterprise Data Isolation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

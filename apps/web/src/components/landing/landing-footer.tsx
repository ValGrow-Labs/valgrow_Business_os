import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, ArrowUpRight } from "lucide-react";

interface LandingFooterProps {
  onGetStartedClick: () => void;
}

export function LandingFooter({ onGetStartedClick }: LandingFooterProps) {
  const { resolved, toggle } = useTheme();

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.querySelector(id);
    if (target) {
      const topOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="border-t border-border/60 bg-surface-2/40 text-muted-foreground text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-border/80 shadow-xs">
                <BrandLogo className="h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg tracking-tight text-foreground">
                  ValGrow
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Business Operating System
                </span>
              </div>
            </Link>

            <p className="text-muted-foreground leading-relaxed max-w-sm">
              ValGrow Business OS is an integrated business management platform designed to help
              small and medium-sized businesses manage and grow operations from one centralized
              system.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggle}
                className="h-8 gap-2 text-xs bg-surface"
              >
                {resolved === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span>{resolved === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </Button>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Product & Modules
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  onClick={(e) => scrollTo(e, "#features")}
                  className="hover:text-foreground transition-colors"
                >
                  Smart POS & Billing
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => scrollTo(e, "#features")}
                  className="hover:text-foreground transition-colors"
                >
                  Inventory Management
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => scrollTo(e, "#features")}
                  className="hover:text-foreground transition-colors"
                >
                  Purchasing & Suppliers
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => scrollTo(e, "#features")}
                  className="hover:text-foreground transition-colors"
                >
                  Customer 360° & AR
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => scrollTo(e, "#features")}
                  className="hover:text-foreground transition-colors"
                >
                  Accounting & Ledgers
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => scrollTo(e, "#features")}
                  className="hover:text-foreground transition-colors"
                >
                  Branch Management
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions & Flow */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Solutions
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#solutions"
                  onClick={(e) => scrollTo(e, "#solutions")}
                  className="hover:text-foreground transition-colors"
                >
                  Retail Stores
                </a>
              </li>
              <li>
                <a
                  href="#solutions"
                  onClick={(e) => scrollTo(e, "#solutions")}
                  className="hover:text-foreground transition-colors"
                >
                  Supermarkets & Grocery
                </a>
              </li>
              <li>
                <a
                  href="#solutions"
                  onClick={(e) => scrollTo(e, "#solutions")}
                  className="hover:text-foreground transition-colors"
                >
                  Wholesale & Distribution
                </a>
              </li>
              <li>
                <a
                  href="#solutions"
                  onClick={(e) => scrollTo(e, "#solutions")}
                  className="hover:text-foreground transition-colors"
                >
                  Multi-Branch Chains
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => scrollTo(e, "#how-it-works")}
                  className="hover:text-foreground transition-colors"
                >
                  How ValGrow Works
                </a>
              </li>
            </ul>
          </div>

          {/* Access & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Platform Access
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium flex items-center gap-1"
                >
                  Sign In to Workspace <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onGetStartedClick}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Request Platform Demo
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onGetStartedClick}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Contact Product Team
                </button>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-foreground transition-colors">
                  System Workflow Tour
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Status Bar */}
        <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            &copy; 2026 ValGrow Labs. All rights reserved. ValGrow Business OS.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-success font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              All Systems Operational
            </span>
            <span className="text-border">|</span>
            <span>Enterprise Multi-Tenant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

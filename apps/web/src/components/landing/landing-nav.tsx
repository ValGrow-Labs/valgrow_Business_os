import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Moon, Sun, ArrowRight, Shield, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

interface LandingNavProps {
  onGetStartedClick: () => void;
}

export function LandingNav({ onGetStartedClick }: LandingNavProps) {
  const { resolved, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Solutions", href: "#solutions" },
    { label: "Modules", href: "#modules" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/60 shadow-sm"
          : "bg-background/40 backdrop-blur-sm border-b border-border/20"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 border border-border/80 shadow-xs transition-transform group-hover:scale-105">
            <BrandLogo className="h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg tracking-tight text-foreground">
                ValGrow
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                OS
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground hidden sm:block">
              Business Operating System
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-surface-2/60"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Sign In button */}
          <Button asChild variant="ghost" size="sm" className="font-medium text-sm">
            <Link to="/login">Sign In</Link>
          </Button>

          {/* Primary CTA */}
          <Button
            size="sm"
            onClick={onGetStartedClick}
            className="font-medium shadow-sm transition-all hover:shadow-md"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-9 w-9 text-muted-foreground"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/80 bg-background/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="block px-3 py-2 text-base font-medium rounded-lg text-foreground hover:bg-surface-2 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full justify-center">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                Sign In to Workspace
              </Link>
            </Button>
            <Button
              className="w-full justify-center font-medium"
              onClick={() => {
                setMobileMenuOpen(false);
                onGetStartedClick();
              }}
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

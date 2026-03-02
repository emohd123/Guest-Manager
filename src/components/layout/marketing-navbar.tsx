"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, CheckCircle, Ticket, Globe, Sun, Moon } from "lucide-react";

const products = [
  {
    name: "Event Check-In App",
    description: "Real-time guest check-in across unlimited devices",
    href: "/event-check-in-app",
    icon: CheckCircle,
  },
  {
    name: "Ticket Studio",
    description: "Design, distribute, and scan tickets",
    href: "/ticket-studio",
    icon: Ticket,
  },
  {
    name: "Registration & Ticketing",
    description: "Online event pages with ticket sales",
    href: "/registration-ticketing",
    icon: Globe,
  },
];

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-md"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              <span className="text-primary text-glow drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">Guest</span>Manager
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground">
                    Products <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[320px] p-2 glass-panel border-border">
                  {products.map((product) => (
                    <DropdownMenuItem key={product.href} asChild className="rounded-xl p-3 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors duration-200">
                      <Link
                        href={product.href}
                        className="flex items-start gap-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                          <product.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {product.description}
                          </p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/tour">
                <Button
                  variant="ghost"
                  className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground ${pathname?.startsWith("/tour") ? "text-primary text-glow font-medium" : ""}`}
                >
                  Tour
                </Button>
              </Link>

              <Link href="/pricing">
                <Button
                  variant="ghost"
                  className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground ${pathname === "/pricing" ? "text-primary text-glow font-medium" : ""}`}
                >
                  Pricing
                </Button>
              </Link>

              <Link href="/contact">
                <Button
                  variant="ghost"
                  className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground ${pathname === "/contact" ? "text-primary text-glow font-medium" : ""}`}
                >
                  Contact
                </Button>
              </Link>
            </nav>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground transition-colors mr-2"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button asChild variant="ghost" className="hover:bg-accent transition-colors">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="shadow-[0_4px_20px_0_rgba(99,102,241,0.5)] hover:shadow-[0_6px_25px_0_rgba(99,102,241,0.7)] transition-all duration-300">
              <Link href="/signup">Try It Free</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-black/10 dark:hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {products.map((product) => (
              <Link
                key={product.href}
                href={product.href}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                <product.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              </Link>
            ))}
            <hr className="my-2" />
            <Link
              href="/tour"
              className="rounded-lg p-3 hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Tour
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg p-3 hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="rounded-lg p-3 hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
            <hr className="my-2" />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button asChild variant="outline" className="flex-1 w-full">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Log In
                </Link>
              </Button>
              <Button asChild className="flex-1 w-full">
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  Try It Free
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
    </>
  );
}

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
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Menu, X, ChevronDown, BriefcaseBusiness, CalendarDays, Ticket } from "lucide-react";

const products = [
  {
    name: "Browse Events",
    description: "Concerts, exhibitions, family shows, business events, and more",
    href: "/",
    icon: CalendarDays,
  },
  {
    name: "My Tickets",
    description: "Open buyer account, orders, QR tickets, and saved events",
    href: "/account",
    icon: Ticket,
  },
  {
    name: "Our Services",
    description: "Ticketing, staffing, check-in operations, and guest support",
    href: "/events",
    icon: BriefcaseBusiness,
  },
];

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextLang = lang === "ar" ? "en" : "ar";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLang(params.get("locale") === "ar" ? "ar" : "en");
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#080911]/70 backdrop-blur-md border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-none items-center justify-between px-4 sm:px-8 lg:px-12 2xl:px-20">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <Link href="/" aria-label="Events Hub home">
                <BrandWordmark
                  className="gap-x-5"
                  markClassName="h-10 w-10 sm:h-14 sm:w-14"
                  textClassName="text-[1.5rem] sm:text-[2.35rem]"
                />
              </Link>
              <a
                href="https://onestoneads.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-fit pl-1 text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground/60 transition-colors hover:text-cyan-300 sm:text-[10px]"
              >
                A OneStone Platform
              </a>
            </div>

            <nav className="hidden items-center gap-2 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground">
                    Explore <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[320px] p-2 glass-panel border-border">
                  {products.map((product) => (
                    <DropdownMenuItem key={product.href} asChild className="rounded-xl p-3 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors duration-200">
                      <Link
                        href={product.href}
                        className="flex items-start gap-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-[0_0_15px_rgba(124,77,255,0.15)]">
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

              <Link href="/events">
                <Button
                  variant="ghost"
                  className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground ${pathname?.startsWith("/events") ? "text-primary text-glow font-medium" : ""}`}
                >
                  Our Services
                </Button>
              </Link>

              <Link href="/account">
                <Button
                  variant="ghost"
                  className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-foreground ${pathname?.startsWith("/account") ? "text-primary text-glow font-medium" : ""}`}
                >
                  My Tickets
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

          <div className="hidden items-center gap-3 md:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-foreground/80">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Live in Bahrain
            </span>
            <Button asChild variant="ghost" className="rounded-full border border-white/15 px-4 font-bold hover:bg-black/5 dark:hover:bg-white/10">
              <Link href={`${pathname || "/"}?locale=${nextLang}`}>{lang === "ar" ? "English" : "العربية"}</Link>
            </Button>
            <Button asChild variant="ghost" className="hover:bg-accent transition-colors">
              <Link href="/account/login">Buyer Login</Link>
            </Button>
             <Button asChild className="shadow-[0_4px_20px_0_rgba(124,77,255,0.4)] hover:shadow-[0_6px_25px_0_rgba(124,77,255,0.55)] transition-all duration-300 bg-brand-gradient hover:opacity-95 text-white">
               <Link href="/">Browse Events</Link>
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
        <div className="border-b border-white/5 bg-[#080911]/95 backdrop-blur-xl px-4 py-4 md:hidden">
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
              href="/events"
              className="rounded-lg p-3 hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Our Services
            </Link>
            <Link
              href="/account"
              className="rounded-lg p-3 hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              My Tickets
            </Link>
            <Link
              href="/contact"
              className="rounded-lg p-3 hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Live in Bahrain
              </span>
              <Button asChild variant="outline" size="sm" className="rounded-full px-4 font-bold">
                <Link href={`${pathname || "/"}?locale=${nextLang}`} onClick={() => setMobileOpen(false)}>
                  {lang === "ar" ? "English" : "العربية"}
                </Link>
              </Button>
            </div>
            <hr className="my-2" />
            <div className="flex gap-2">

              <Button asChild variant="outline" className="flex-1 w-full">
                <Link href="/account/login" onClick={() => setMobileOpen(false)}>
                  Buyer Login
                </Link>
              </Button>
              <Button asChild className="flex-1 w-full">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  Browse
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

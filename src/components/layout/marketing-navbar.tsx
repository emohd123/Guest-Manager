"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Moon, Search, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { createClient } from "@/lib/supabase/client";

type AccountIdentity = {
  name: string;
  avatarUrl: string | null;
};

function accountIdentity(user: User): AccountIdentity {
  const metadata = user.user_metadata ?? {};
  const name = typeof metadata.name === "string" && metadata.name.trim()
    ? metadata.name
    : user.email?.split("@")[0] ?? "My profile";
  const avatarUrl = typeof metadata.avatar_url === "string"
    ? metadata.avatar_url
    : typeof metadata.picture === "string"
      ? metadata.picture
      : null;

  return { name, avatarUrl };
}

export function MarketingNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = searchParams.get("locale") === "ar" ? "ar" : "en";
  const [account, setAccount] = useState<AccountIdentity | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const nextLang = lang === "ar" ? "en" : "ar";
  const isSearchPage = pathname === "/search";
  const mobileSearchOpen = !isSearchPage && searchParams.get("focus") === "search";
  const searchInputRef = useRef<HTMLInputElement>(null);
  const languageParams = new URLSearchParams(searchParams.toString());
  languageParams.set("locale", nextLang);
  const languageHref = `${pathname || "/"}?${languageParams.toString()}`;

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setAccount(data.user ? accountIdentity(data.user) : null);
    });

    try {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setAccount(session?.user ? accountIdentity(session.user) : null);
      });
      return () => {
        active = false;
        listener.subscription.unsubscribe();
      };
    } catch {
      return () => {
        active = false;
      };
    }
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [mobileSearchOpen]);

  return (
    <header dir="ltr" className={`${isSearchPage ? "hidden sm:block" : ""} fixed top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 text-slate-950 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/95 dark:text-white`}>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-2 px-3 sm:h-16 sm:px-8 lg:px-12">
        <div dir="ltr" className="flex shrink-0 items-center">
          <Link href="/" aria-label="iTicket home">
            <BrandWordmark
              className="gap-x-2 sm:gap-x-4"
              markClassName="h-9 w-9 sm:h-12 sm:w-12"
              textClassName="text-[1.45rem] text-slate-950 dark:text-white sm:text-[2.1rem]"
            />
          </Link>
        </div>

        <form action="/search" method="get" className={`${mobileSearchOpen ? "fixed left-3 right-3 top-[4.25rem] z-10 flex max-w-none shadow-lg sm:static sm:mx-5 sm:w-full sm:max-w-md sm:shadow-none" : "hidden sm:flex mx-5 w-full max-w-md"} items-center rounded-full border border-slate-200 bg-slate-50 px-4 transition focus-within:border-cyan-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-900 dark:focus-within:bg-slate-900`}>
          <input type="hidden" name="locale" value={lang} />
          <input type="hidden" name="focus" value="search" />
          <Search className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <input
            ref={searchInputRef}
            name="q"
            type="search"
            placeholder={lang === "ar" ? "ابحث عن فعاليات..." : "Search events..."}
            className="h-10 w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
          <button type="submit" aria-label="Search events" className="rounded-full p-1 text-slate-500 transition hover:text-cyan-700 dark:text-slate-400 dark:hover:text-cyan-300">
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300 sm:h-10 sm:w-10"
          >
            {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {account ? (
            <Link
              href="/account"
              aria-label="Open my profile and tickets"
              title="My profile and tickets"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800 transition hover:scale-105 hover:border-cyan-500 dark:bg-cyan-400/10 dark:text-cyan-200"
            >
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-black">{account.name.slice(0, 1).toUpperCase()}</span>
              )}
            </Link>
          ) : (
            <Link
              href="/account/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cyan-600 px-3 text-xs font-black text-white transition hover:bg-cyan-700 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <UserRound className="h-4 w-4" />
              {lang === "ar" ? "تسجيل الدخول" : "Login"}
            </Link>
          )}
          <Link
            href={languageHref}
            onClick={(event) => {
              event.preventDefault();
              window.location.assign(languageHref);
            }}
            className="inline-flex h-9 items-center rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:h-10 sm:px-4 sm:text-sm"
          >
            {lang === "ar" ? "English" : "العربية"}
          </Link>
        </div>
      </div>
    </header>
  );
}

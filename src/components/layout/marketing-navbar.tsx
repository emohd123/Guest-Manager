"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Search, UserRound } from "lucide-react";
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
  const nextLang = lang === "ar" ? "en" : "ar";
  const languageParams = new URLSearchParams(searchParams.toString());
  languageParams.set("locale", nextLang);
  const languageHref = `${pathname || "/"}?${languageParams.toString()}`;

  useEffect(() => {
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

  return (
    <header dir="ltr" className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#171717]">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:px-12">
        <div dir="ltr" className="flex flex-col">
          <Link href="/" aria-label="iTicket home">
            <BrandWordmark
              className="gap-x-4"
              markClassName="h-9 w-9 sm:h-10 sm:w-10"
              textClassName="text-[1.5rem] text-white sm:text-[1.8rem]"
            />
          </Link>
          <a
            href="https://onestoneads.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 w-fit pl-1 text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 transition hover:text-cyan-300 sm:text-[10px]"
          >
            A OneStone Platform
          </a>
        </div>

        <form action="/" method="get" className="mx-5 hidden w-full max-w-md items-center rounded-full border border-white/20 bg-white/5 px-4 transition focus-within:border-cyan-300 sm:flex">
          <input type="hidden" name="locale" value={lang} />
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            name="q"
            type="search"
            placeholder={lang === "ar" ? "ابحث عن فعاليات..." : "Search events..."}
            className="h-10 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-400"
          />
          <button type="submit" aria-label="Search events" className="rounded-full p-1 text-slate-300 transition hover:text-cyan-300">
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className="flex items-center gap-3">
          {account ? (
            <Link
              href="/account"
              aria-label="Open my profile and tickets"
              title="My profile and tickets"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-cyan-300/70 bg-cyan-300/10 text-cyan-100 transition hover:scale-105 hover:border-cyan-200"
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
              className="inline-flex h-10 items-center gap-2 rounded-full bg-cyan-300 px-4 text-sm font-black text-black transition hover:bg-cyan-200"
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
            className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/10"
          >
            {lang === "ar" ? "English" : "العربية"}
          </Link>
        </div>
      </div>
    </header>
  );
}

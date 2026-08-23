"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, Heart, Home, Search, Ticket } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ShortcutId = "home" | "search" | "favourite" | "private" | "tickets";

export function PublicShortcutDock() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArabic = searchParams.get("locale") === "ar";
  const [activeShortcut, setActiveShortcut] = useState<ShortcutId>("home");

  function localeHref(path: string) {
    const [base, query = ""] = path.split("?");
    const params = new URLSearchParams(query);
    params.set("locale", isArabic ? "ar" : "en");
    return `${base}?${params.toString()}`;
  }

  useEffect(() => {
    if (pathname.startsWith("/search")) setActiveShortcut("search");
    else if (pathname.startsWith("/account/favorites")) setActiveShortcut("favourite");
    else if (pathname.startsWith("/private-event")) setActiveShortcut("private");
    else if (pathname.startsWith("/account")) setActiveShortcut("tickets");
    else if (pathname === "/") setActiveShortcut("home");
  }, [pathname]);

  function focusSearch() {
    setActiveShortcut("search");
    router.push(localeHref("/search"));
  }

  function goHome() {
    setActiveShortcut("home");
    const homeHref = localeHref("/");
    if (pathname === "/") {
      window.dispatchEvent(new Event("iticket:home-reset"));
      router.replace(homeHref);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push(homeHref);
  }

  const shortcuts: Array<{ id: ShortcutId; icon: ReactNode; label: string; onClick: () => void }> = [
    { id: "home", icon: <Home className="h-5 w-5" />, label: isArabic ? "الرئيسية" : "Home", onClick: goHome },
    { id: "search", icon: <Search className="h-5 w-5" />, label: isArabic ? "بحث" : "Search", onClick: focusSearch },
    { id: "favourite", icon: <Heart className="h-5 w-5" />, label: isArabic ? "المفضلة" : "Favourite", onClick: () => { setActiveShortcut("favourite"); router.push(localeHref("/account/favorites")); } },
    { id: "private", icon: <CalendarDays className="h-5 w-5" />, label: isArabic ? "فعالية خاصة" : "Private Event", onClick: () => { setActiveShortcut("private"); router.push(localeHref("/private-event")); } },
    { id: "tickets", icon: <Ticket className="h-5 w-5" />, label: isArabic ? "My Tickets" : "My Tickets", onClick: () => { setActiveShortcut("tickets"); router.push(localeHref("/account/tickets")); } },
  ];
  const isSearchPage = pathname.startsWith("/search");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-50 flex justify-center px-2 sm:bottom-3">
      <nav dir={isArabic ? "rtl" : "ltr"} aria-label="Application shortcuts" className={`pointer-events-auto flex items-stretch rounded-2xl border p-1 backdrop-blur sm:shadow-[0_12px_40px_rgba(15,23,42,0.2)] ${isSearchPage ? "border-slate-200 bg-white/95 text-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.18)]" : "border-slate-200 bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900/95"}`}>
        {shortcuts.map((shortcut) => {
          const active = activeShortcut === shortcut.id;
          return (
            <button
              key={shortcut.id}
              type="button"
              onClick={shortcut.onClick}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[54px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-[9px] font-black leading-tight transition sm:min-w-[74px] sm:gap-1 sm:px-2 sm:py-2 sm:text-[10px] ${active ? (isSearchPage ? "bg-cyan-50 text-blue-600" : "bg-cyan-50 text-blue-600 dark:bg-cyan-300/10 dark:text-cyan-300") : (isSearchPage ? "text-slate-700 hover:bg-slate-100 hover:text-blue-600" : "text-slate-700 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300")}`}
            >
              <span className={active ? (isSearchPage ? "text-blue-600" : "text-blue-600 dark:text-cyan-300") : (isSearchPage ? "text-slate-800" : "text-slate-800 dark:text-slate-200")}>{shortcut.icon}</span>
              <span className="text-center">{shortcut.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

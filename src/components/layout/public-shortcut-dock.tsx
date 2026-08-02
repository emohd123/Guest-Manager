"use client";

import { CalendarDays, Heart, Home, Search, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PublicShortcutDock() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArabic = searchParams.get("locale") === "ar";

  function localeHref(path: string) {
    const [base, query = ""] = path.split("?");
    const params = new URLSearchParams(query);
    params.set("locale", isArabic ? "ar" : "en");
    return `${base}?${params.toString()}`;
  }

  function focusSearch() {
    const search = document.querySelector<HTMLInputElement>('input[name="q"]');
    if (search) {
      search.focus();
      return;
    }
    router.push(localeHref("/"));
  }

  function goHome() {
    const homeHref = localeHref("/");
    if (pathname === "/") {
      window.dispatchEvent(new Event("iticket:home-reset"));
      router.replace(homeHref);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push(homeHref);
  }

  const shortcuts = [
    {
      icon: <Home className="h-5 w-5" />,
      label: isArabic ? "الرئيسية" : "Home",
      onClick: goHome,
    },
    { icon: <Search className="h-5 w-5" />, label: isArabic ? "بحث" : "Search", onClick: focusSearch },
    { icon: <Heart className="h-5 w-5" />, label: isArabic ? "المفضلة" : "Favourite", onClick: () => router.push(localeHref("/account/favorites")) },
    { icon: <CalendarDays className="h-5 w-5" />, label: isArabic ? "فعالية خاصة" : "Private Event", onClick: () => router.push(localeHref("/private-event")) },
    { icon: <User className="h-5 w-5" />, label: isArabic ? "الملف الشخصي" : "Profile", onClick: () => router.push(localeHref("/account")) },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-2">
      <nav dir="ltr" aria-label="Application shortcuts" className="pointer-events-auto flex items-stretch rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-[0_12px_40px_rgba(15,23,42,0.2)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            onClick={shortcut.onClick}
            className="flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black leading-tight text-slate-700 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300 sm:min-w-[74px]"
          >
            <span className={shortcut.label === "Home" ? "text-blue-600 dark:text-cyan-300" : "text-slate-800 dark:text-slate-200"}>{shortcut.icon}</span>
            <span className="text-center">{shortcut.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

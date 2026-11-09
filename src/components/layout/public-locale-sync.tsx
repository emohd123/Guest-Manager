"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PublicLocaleSync() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = searchParams.get("locale") === "ar" ? "ar" : "en";

  useEffect(() => {
    let effectiveLocale = locale;
    try {
      if (!searchParams.has("locale") && localStorage.getItem("iticket-locale") === "ar") effectiveLocale = "ar";
      if (searchParams.has("locale")) localStorage.setItem("iticket-locale", locale);
    } catch { /* Language selection remains usable when browser storage is unavailable. */ }
    document.documentElement.lang = effectiveLocale;
    document.documentElement.dir = effectiveLocale === "ar" ? "rtl" : "ltr";
    if (!searchParams.has("locale") && effectiveLocale === "ar") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("locale", "ar");
      router.replace(`${pathname}?${params.toString()}${window.location.hash}`);
    }
  }, [locale, pathname, router, searchParams]);

  return null;
}

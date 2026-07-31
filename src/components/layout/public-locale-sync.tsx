"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PublicLocaleSync() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = searchParams.get("locale") === "ar" ? "ar" : "en";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    localStorage.setItem("iticket-locale", locale);
  }, [locale]);

  useEffect(() => {
    if (searchParams.has("locale") || localStorage.getItem("iticket-locale") !== "ar") return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", "ar");
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  return null;
}

"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { translatePublicText } from "@/lib/public-copy";

export function usePublicCopy() {
  const locale = useSearchParams().get("locale") === "ar" ? "ar" : "en";
  return useMemo(() => Object.assign((text: string) => translatePublicText(text, locale), {
    locale,
    href: (path: string) => {
      if (!path.startsWith("/") || path.startsWith("//")) return path;
      const url = new URL(path, "https://www.iticket.info");
      url.searchParams.set("locale", locale);
      return `${url.pathname}${url.search}${url.hash}`;
    },
  }), [locale]);
}

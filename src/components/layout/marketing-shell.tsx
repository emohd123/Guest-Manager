"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { PublicShortcutDock } from "@/components/layout/public-shortcut-dock";

export function MarketingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isConferencePortal = pathname.startsWith("/private-event/portal/");
  return <>
    {!isConferencePortal && <Suspense fallback={<div className="h-16 border-b border-border bg-white" />}><MarketingNavbar /></Suspense>}
    <main className="flex-1">{children}</main>
    {!isConferencePortal && <><MarketingFooter /><Suspense fallback={null}><PublicShortcutDock /></Suspense></>}
  </>;
}

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { PublicShortcutDock } from "@/components/layout/public-shortcut-dock";
import { PublicLocaleSync } from "@/components/layout/public-locale-sync";
import { Suspense } from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-theme-scope flex min-h-screen flex-col bg-background text-foreground selection:bg-cyan-200 selection:text-slate-950">
      <Suspense fallback={null}>
        <PublicLocaleSync />
      </Suspense>
      <Suspense fallback={<div className="h-16 border-b border-border bg-white" />}>
        <MarketingNavbar />
      </Suspense>
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <Suspense fallback={null}>
        <PublicShortcutDock />
      </Suspense>
    </div>
  );
}

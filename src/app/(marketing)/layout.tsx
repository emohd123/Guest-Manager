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
    <div className="public-theme-scope dark flex min-h-screen flex-col bg-[#080808] text-white selection:bg-cyan-300 selection:text-slate-950">
      <Suspense fallback={null}>
        <PublicLocaleSync />
      </Suspense>
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <PublicShortcutDock />
    </div>
  );
}

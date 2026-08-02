import { Suspense } from "react";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { PublicShortcutDock } from "@/components/layout/public-shortcut-dock";

export default function PublicEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-theme-scope flex min-h-screen flex-col bg-background">
      <Suspense fallback={<div className="h-16 border-b border-border bg-white" />}>
        <MarketingNavbar />
      </Suspense>
      <div className="flex-1">{children}</div>
      <MarketingFooter />
      <Suspense fallback={null}>
        <PublicShortcutDock />
      </Suspense>
    </div>
  );
}

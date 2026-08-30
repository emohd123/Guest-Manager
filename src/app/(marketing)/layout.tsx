import { MarketingShell } from "@/components/layout/marketing-shell";
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
      <MarketingShell>{children}</MarketingShell>
    </div>
  );
}

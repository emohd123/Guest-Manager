"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DashboardSidebar, MobileEventSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { trpc } from "@/lib/trpc/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileNavView, setMobileNavView] = useState<"main" | "event">("main");
  const pathname = usePathname();
  const eventMatch = pathname.match(/^\/dashboard\/events\/([^/]+)/);
  const currentEventId = eventMatch?.[1] && eventMatch[1] !== "new" ? eventMatch[1] : null;
  const { data: company } = trpc.settings.getCompany.useQuery(undefined, { enabled: mounted });
  useEffect(() => setMounted(true), []);
  const closeMobileNavigation = () => {
    setMobileOpen(false);
    setMobileNavView("main");
  };
  const handleMobileOpenChange = (open: boolean) => {
    setMobileOpen(open);
    if (!open) setMobileNavView("main");
  };
  return (
    <div suppressHydrationWarning className="dashboard-theme-scope flex h-screen relative overflow-hidden text-foreground bg-background transition-colors duration-300">
      {mounted ? <CommandPalette /> : null}
      <div className="hidden lg:block absolute inset-y-0 left-0 z-50"><DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} /></div>
      <Sheet open={mobileOpen} onOpenChange={handleMobileOpenChange}>
        <SheetContent side="left" className="w-80 p-0 border-r border-border bg-card">
          {mobileNavView === "main" ? (
            <DashboardSidebar
              collapsed={false}
              onToggle={closeMobileNavigation}
              onEventsClick={() => setMobileNavView("event")}
              onMobileNavigate={closeMobileNavigation}
            />
          ) : (
            <MobileEventSidebar
              eventId={currentEventId}
              onBack={() => setMobileNavView("main")}
              onNavigate={closeMobileNavigation}
            />
          )}
        </SheetContent>
      </Sheet>
      <div className={cn("flex flex-1 flex-col overflow-hidden transition-all duration-300 relative z-30", collapsed ? "lg:ml-16" : "lg:ml-64")}>
        <DashboardTopbar onMenuClick={() => setMobileOpen(true)} companyName={company?.name ?? "Company"} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 relative z-0">
          {mounted ? <AnimatePresence mode="wait"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }} className="h-full">{children}</motion.div></AnimatePresence> : <div className="h-full rounded-[32px] border border-border bg-card/60 animate-pulse" />}
        </main>
      </div>
    </div>
  );
}

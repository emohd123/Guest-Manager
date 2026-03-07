"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { trpc } from "@/lib/trpc/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { data: company } = trpc.settings.getCompany.useQuery(undefined, {
    enabled: mounted,
  });
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      suppressHydrationWarning
      className={cn(
        "dashboard-theme-scope flex h-screen relative overflow-hidden text-foreground transition-colors duration-300",
        mounted && isDark
          ? "bg-modychat"
          : "bg-[radial-gradient(circle_at_top_left,_rgba(255,91,106,0.10),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]"
      )}
    >
      {mounted ? <CommandPalette /> : null}

      {/* Desktop sidebar - Absolute to let background show through the glass */}
      <div className="hidden lg:block absolute inset-y-0 left-0 z-50">
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 border-r border-border bg-card">
          <DashboardSidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area - Margin left pushed to avoid hiding under the absolute sidebar */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300 relative z-30",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <DashboardTopbar
          onMenuClick={() => setMobileOpen(true)}
          companyName={company?.name ?? "Company"}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 relative z-0">
          {mounted ? (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-full rounded-[32px] border border-border bg-card/60 animate-pulse" />
          )}
        </main>
      </div>
    </div>
  );
}

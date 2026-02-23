"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen relative overflow-hidden bg-background">
      <CommandPalette />

      {/* Desktop sidebar - Absolute to let background show through the glass */}
      <div className="hidden lg:block absolute inset-y-0 left-0 z-50">
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 border-r-white/5 glass-panel">
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
        <DashboardTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 relative z-0">
          {/* Subtle background glow effect behind the main content area */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent" />
          {children}
        </main>
      </div>
    </div>
  );
}

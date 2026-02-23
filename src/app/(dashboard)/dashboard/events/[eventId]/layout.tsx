"use client";

import { use } from "react";
import { EventSidebar } from "@/components/layout/event-sidebar";

export default function EventDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  return (
    <div className="flex -mx-4 lg:-mx-8 -my-4 lg:-my-8 h-[calc(100vh-4rem)]">
      {/* Event Sidebar Sidebar */}
      <div className="hidden md:flex shrink-0 border-r border-border h-full bg-background/50 backdrop-blur-md relative z-10 w-64 shadow-md">
        <EventSidebar eventId={eventId} />
      </div>

      {/* Main Event Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 pb-24 relative">
        {/* Subtle background glow effect behind the main content area */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-bl from-primary/5 via-transparent to-transparent" />
        {children}
      </div>
    </div>
  );
}

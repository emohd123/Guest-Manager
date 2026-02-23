"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Ticket,
  ShoppingCart,
  Smartphone,
  ScanLine,
  FileText,
  Settings,
  Mail,
  List,
  Upload,
  Megaphone,
  Paintbrush,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const getNavigation = (eventId: string) => [
  {
    group: "Main",
    items: [
      { label: "Overview", href: `/dashboard/events/${eventId}`, icon: LayoutDashboard },
      { label: "Attendees", href: `/dashboard/events/${eventId}/guests`, icon: Users },
      { label: "Sessions", href: `/dashboard/events/${eventId}/sessions`, icon: CalendarDays },
    ],
  },
  {
    group: "Ticketing",
    items: [
      { label: "Orders", href: `/dashboard/events/${eventId}/orders`, icon: ShoppingCart },
      { label: "Registration types", href: `/dashboard/events/${eventId}/registration-types`, icon: Ticket },
    ],
  },
  {
    group: "Onsite",
    items: [
      { label: "Devices", href: `/dashboard/events/${eventId}/devices`, icon: Smartphone },
      { label: "Arrivals", href: `/dashboard/events/${eventId}/check-in`, icon: ScanLine },
      { label: "Check in report", href: `/dashboard/events/${eventId}/reports`, icon: FileText },
    ],
  },
  {
    group: "Manage",
    items: [
      { label: "Design and setup", href: `/dashboard/events/${eventId}/design`, icon: Paintbrush },
      { label: "Edit event details", href: `/dashboard/events/${eventId}/settings`, icon: Settings },
      { label: "Sent emails", href: `/dashboard/events/${eventId}/emails`, icon: Mail },
      { label: "Ticket types", href: `/dashboard/events/${eventId}/tickets`, icon: Ticket },
      { label: "Imports", href: `/dashboard/events/${eventId}/imports`, icon: Upload },
      { label: "Lists", href: `/dashboard/events/${eventId}/lists`, icon: List },
      { label: "Campaigns", href: `/dashboard/events/${eventId}/campaigns`, icon: Megaphone },
    ],
  },
];

export function EventSidebar({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const navigation = getNavigation(eventId);

  return (
    <div className="flex h-full w-64 flex-col border-r border-border glass-panel">
      {/* Top Header */}
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Button>
        </Link>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {navigation.map((group) => (
            <div key={group.group}>
              <h4 className="mb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.group}
              </h4>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  // Precise matching to ensure "Overview" doesn't light up for nested routes
                  const isActive = 
                    item.href === `/dashboard/events/${eventId}` 
                      ? pathname === item.href 
                      : pathname.startsWith(item.href);
                      
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/70 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

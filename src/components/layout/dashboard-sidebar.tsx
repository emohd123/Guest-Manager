"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  LockKeyhole,
  Users,
  Armchair,
  ShoppingCart,
  Smartphone,
  ScanLine,
  FileText,
  Mail,
  List,
  Upload,
  Megaphone,
  Paintbrush,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { trpc } from "@/lib/trpc/client";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Events",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    label: "Private Conferences",
    href: "/dashboard/private-events",
    icon: LockKeyhole,
  },
  {
    label: "Tickets",
    href: "/dashboard/tickets",
    icon: Ticket,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
];

const bottomNavigation = [
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const getEventNavigation = (eventId: string) => [
  {
    group: "Event",
    items: [
      { label: "Overview", href: `/dashboard/events/${eventId}`, icon: LayoutDashboard },
      { label: "Attendees", href: `/dashboard/events/${eventId}/guests`, icon: Users },
      { label: "Seating", href: `/dashboard/events/${eventId}/seating`, icon: Armchair },
      { label: "Sessions", href: `/dashboard/events/${eventId}/sessions`, icon: CalendarDays },
    ],
  },
  {
    group: "Ticketing",
    items: [
      { label: "Orders", href: `/dashboard/events/${eventId}/orders`, icon: ShoppingCart },
      { label: "Ticket types", href: `/dashboard/events/${eventId}/tickets`, icon: Ticket },
      { label: "Promo codes", href: `/dashboard/events/${eventId}/promotions`, icon: Tag },
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
      { label: "Imports", href: `/dashboard/events/${eventId}/imports`, icon: Upload },
      { label: "Lists", href: `/dashboard/events/${eventId}/lists`, icon: List },
      { label: "Campaigns", href: `/dashboard/events/${eventId}/campaigns`, icon: Megaphone },
    ],
  },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: access } = trpc.settings.getAccess.useQuery();
  // Fail closed while access is loading so restricted customers never see admin links flash.
  const isReadOnly = access?.readOnly === true;
  const visibleNavigation = access === undefined
    ? []
    : isReadOnly
      ? navigation.filter((item) => item.href === "/dashboard/events")
      : navigation;
  const eventMatch = pathname.match(/^\/dashboard\/events\/([^/]+)/);
  const eventId = eventMatch?.[1] && eventMatch[1] !== "new" ? eventMatch[1] : null;
  const eventNavigation = eventId && access
    ? getEventNavigation(eventId)
        .map((group) => ({
          ...group,
          items: access.readOnly
            ? group.items.filter((item) => [
                `/dashboard/events/${eventId}`,
                `/dashboard/events/${eventId}/guests`,
                `/dashboard/events/${eventId}/check-in`,
                `/dashboard/events/${eventId}/reports`,
              ].includes(item.href))
            : group.items,
        }))
        .filter((group) => group.items.length > 0)
    : [];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "glass-panel relative z-50 flex h-screen flex-col border-r border-border text-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between px-6">
        {collapsed ? (
          <Link href="/" aria-label="Return to iTicket website">
            <BrandMark className="h-11 w-11" />
          </Link>
        ) : (
          <Link href="/" aria-label="Return to iTicket website">
            <BrandWordmark
              className="gap-2.5"
              markClassName="h-11 w-11"
              textClassName="text-[1.55rem]"
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform duration-500",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <div className="px-4 mb-4">
        <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1.5">
          {access === undefined ? (
            <div className="space-y-3 px-1" aria-label="Loading navigation">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-11 rounded-2xl bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : visibleNavigation.map((item) => {
            const isActive = (item as { exact?: boolean }).exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 relative group outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "bg-primary text-white shadow-[0_0_22px_rgba(124,58,237,0.45)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                )} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/80" />
                )}
              </Link>
            );
          })}
        </nav>

        {eventId && eventNavigation.length > 0 && (
          <div className="mt-5 border-t border-border/70 pt-4 lg:hidden">
            <div className="mb-2 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Current event
            </div>
            <div className="space-y-4">
              {eventNavigation.map((group) => (
                <div key={group.group}>
                  <div className="mb-1 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {group.group}
                  </div>
                  <nav className="space-y-1.5">
                    {group.items.map((item) => {
                      const isActive = item.href === `/dashboard/events/${eventId}`
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => onToggle()}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="px-4 my-2">
        <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Bottom navigation */}
      {access && !access.readOnly && (
      <div className="space-y-1.5 px-3 py-4">
        {bottomNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 group outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-all duration-300 outline-none hover:bg-red-500/10 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
      )}
    </aside>
  );
}

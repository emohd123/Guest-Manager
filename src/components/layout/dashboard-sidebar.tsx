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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
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
          <Link href="/dashboard" aria-label="iTicket dashboard">
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

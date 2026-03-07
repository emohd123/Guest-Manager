"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Ticket,
  ShoppingCart,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  Contact,
  Tag,
  ScanLine,
  Megaphone,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
  {
    label: "Events",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    label: "Contacts",
    href: "/dashboard/contacts",
    icon: Contact,
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    label: "Promotions",
    href: "/dashboard/promotions",
    icon: Tag, // Make sure to import Tag
  },
  {
    label: "Tickets",
    href: "/dashboard/tickets",
    icon: Ticket,
  },
  {
    label: "Scans",
    href: "/dashboard/scans",
    icon: ScanLine, // Make sure to import ScanLine
  },
  {
    label: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Megaphone, // Make sure to import Megaphone
  },
  {
    label: "Form Responses",
    href: "/dashboard/form-responses",
    icon: FileText,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    badge: true, // show unread count badge
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
  const [messagesUnread, setMessagesUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/dashboard/messages");
        if (!res.ok) return;
        const data = await res.json() as { unreadCount?: number };
        if (!cancelled) setMessagesUnread(data.unreadCount ?? 0);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

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
        {!collapsed && (
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-primary italic">Guest</span>
            <span className="text-foreground">Manager</span>
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
          {navigation.map((item, idx) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const showBadge = (item as { badge?: boolean }).badge && !isActive && messagesUnread > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 relative group",
                  isActive
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(255,91,106,0.4)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                )} />
                {!collapsed && <span>{item.label}</span>}
                {showBadge && (
                  <span className={cn(
                    "ml-auto text-[10px] font-bold bg-primary text-white rounded-full px-1.5 py-0.5 leading-none animate-pulse",
                    collapsed && "absolute top-2 right-2 px-1"
                  )}>
                    {messagesUnread > 9 ? "9+" : messagesUnread}
                  </span>
                )}
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
      <div className="space-y-1.5 px-3 py-4">
        {bottomNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 group",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:bg-red-500/10 hover:text-red-400"
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

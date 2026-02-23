"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Users,
  Ticket,
  ShoppingCart,
  Mail,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  Contact,
  Tag,
  ScanLine,
  Megaphone,
  FileText,
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
    icon: FileText, // Make sure to import FileText
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-r-white/5 glass-panel text-sidebar-foreground transition-all duration-300 relative z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/dashboard" className="text-lg font-bold">
            <span className="text-primary">Guest</span>Manager
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 shrink-0"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Bottom navigation */}
      <div className="space-y-1 px-2 py-4">
        {bottomNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

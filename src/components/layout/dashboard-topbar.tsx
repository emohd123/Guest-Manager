"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sun, Moon, Menu, Search, Plus, CalendarDays, Contact, Ticket, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardTopbarProps {
  onMenuClick: () => void;
  userName?: string;
  companyName?: string;
}

export function DashboardTopbar({
  onMenuClick,
  userName = "User",
  companyName = "Company",
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const eventId = segments[0] === "dashboard" && segments[1] === "events" ? segments[2] : undefined;
  const isEventOverview = Boolean(eventId && segments.length === 3);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { setTheme, resolvedTheme } = useTheme();
  const { data: access } = trpc.settings.getAccess.useQuery();
  const isDark = mounted && resolvedTheme === "dark";
  const { data: event } = trpc.events.get.useQuery(
    { id: eventId ?? "" },
    { enabled: mounted && isEventOverview && !!eventId }
  );

  const identityName = companyName || userName;
  const initials = identityName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const pageTitle = (() => {
    if (isEventOverview) {
      return event?.title || "Event";
    }
    const lastSegment = segments.at(-1);
    if (!lastSegment) return "Dashboard";
    if (pathname === "/dashboard/events/new") return "Create Event";
    if (lastSegment === "new") return "Create";
    if (lastSegment === "settings") return "Settings";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment)) {
      return "Details";
    }
    return lastSegment.replace(/-/g, " ");
  })();

  return (
    <header className="sticky top-0 z-40 flex min-h-16 h-auto items-center justify-between gap-3 border-b border-border bg-background/80 px-3 py-2 backdrop-blur-3xl lg:h-20 lg:px-8 lg:py-0">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-foreground lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0 max-w-[52vw] lg:max-w-none">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground lg:text-sm lg:tracking-widest">{companyName}</p>
          <h2 className="truncate text-base font-bold capitalize leading-tight text-foreground lg:text-xl">{pageTitle}</h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 lg:gap-4">
        <Button
          variant="secondary"
          className="hidden h-11 w-72 justify-start gap-3 rounded-2xl border border-border bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground lg:flex"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            );
          }}
        >
          <Search className="h-4 w-4" />
          <span className="font-medium">Search anything...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-6 select-none items-center gap-1 rounded-lg border border-border bg-muted px-2 font-mono text-[10px] font-bold text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {mounted ? (
          <>


              {access && !access.readOnly && (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-11 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] rounded-2xl border border-border bg-popover p-2 text-popover-foreground">
                <DropdownMenuItem asChild className="rounded-xl focus:bg-accent/10 focus:text-popover-foreground">
                  <Link href="/dashboard/events/new" className="cursor-pointer py-2">
                    <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-semibold">New Event</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl focus:bg-accent/10 focus:text-popover-foreground">
                  <Link href="/dashboard/contacts" className="cursor-pointer py-2">
                    <Contact className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-semibold">New Contact</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl focus:bg-accent/10 focus:text-popover-foreground">
                  <Link href="/dashboard/tickets" className="cursor-pointer py-2">
                    <Ticket className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-semibold">Issue Ticket</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl focus:bg-accent/10 focus:text-popover-foreground">
                  <Link href="/dashboard/orders" className="cursor-pointer py-2">
                    <ShoppingCart className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-semibold">Create Order</span>
                  </Link>
                </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Light mode" : "Dark mode"}
                className="h-11 w-11 rounded-2xl border border-border bg-card text-foreground hover:bg-muted"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 rounded-2xl gap-3 pl-1 pr-3 hover:bg-muted">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start leading-none gap-1">
                    <span className="text-sm font-bold text-foreground">{identityName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Workspace</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] rounded-2xl border border-border bg-popover p-2 text-popover-foreground">
                <DropdownMenuItem className="mb-2 border-b border-border px-4 py-3 font-bold hover:bg-transparent">
                  <div className="flex flex-col">
                    <span className="text-sm">{identityName}</span>
                    <span className="text-xs text-muted-foreground font-normal">Workspace</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl focus:bg-accent/10 focus:text-popover-foreground">
                  <Link href="/dashboard/settings" className="cursor-pointer py-2">Settings</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="h-11 w-[220px] rounded-2xl border border-border bg-card/60" />
        )}
      </div>
    </header>
  );
}

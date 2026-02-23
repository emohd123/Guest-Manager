"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sun, Moon, Menu, Search, Plus, CalendarDays, Contact, Ticket, ShoppingCart } from "lucide-react";
import Link from "next/link";

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
  const { setTheme, theme } = useTheme();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-b-white/5 glass-panel px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm font-medium">{companyName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden h-9 w-64 justify-start gap-2 text-sm text-muted-foreground md:flex"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            );
          }}
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Global Add Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="hidden md:flex gap-1.5 ml-2 mr-2">
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/events/new" className="cursor-pointer">
                <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>New Event</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/contacts" className="cursor-pointer">
                <Contact className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>New Contact</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/tickets" className="cursor-pointer">
                <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Issue Ticket</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/orders" className="cursor-pointer">
                <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Create Order</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="font-medium">{userName}</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings">Settings</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

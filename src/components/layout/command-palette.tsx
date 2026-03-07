"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  CalendarDays,
  Users,
  Ticket,
  CheckCircle,
  Settings,
  BarChart3,
  Mail,
  ShoppingCart,
  Plus,
  Search,
  UserPlus,
  FileText,
  CreditCard,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!mounted) return null;

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search events, contacts, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate("/dashboard/events/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Event
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/contacts")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/tickets")}>
            <Ticket className="mr-2 h-4 w-4" />
            Design Ticket
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/events")}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Events
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/contacts")}>
            <Users className="mr-2 h-4 w-4" />
            Contacts
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/tickets")}>
            <Ticket className="mr-2 h-4 w-4" />
            Ticket Studio
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/orders")}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/communications")}>
            <Mail className="mr-2 h-4 w-4" />
            Communications
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/reports")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Reports
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => navigate("/dashboard/settings")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing & Plans
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle {theme === "dark" ? "Light" : "Dark"} Mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

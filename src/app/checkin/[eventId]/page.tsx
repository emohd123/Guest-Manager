"use client";

import { useState, useMemo, useEffect, use } from "react";
import { 
  Search, 
  QrCode, 
  UserPlus, 
  Settings, 
  Wifi, 
  CheckCircle2, 
  Menu,
  Clock,
  Ticket,
  User,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { QRScannerModal, type ScanResult } from "@/components/checkin/QRScannerModal";

export default function CheckinSpa({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "checked_in">("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scannerOpen, setScannerOpen] = useState(false);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load real guests from DB
  const { data: guestsData, isLoading, refetch } = trpc.guests.list.useQuery({
    eventId,
    limit: 500,
  });

  const allGuests = guestsData?.guests;
  const guests = useMemo(() => allGuests ?? [], [allGuests]);

  // Mutations
  const utils = trpc.useUtils();
  const checkInMutation = trpc.guests.checkIn.useMutation({
    onSuccess: () => utils.guests.list.invalidate({ eventId }),
  });
  const undoMutation = trpc.guests.undoCheckIn.useMutation({
    onSuccess: () => utils.guests.list.invalidate({ eventId }),
  });

  // Barcode lookup for real QR scanner
  const handleBarcodeScan = async (barcode: string): Promise<ScanResult> => {
    // Look up the ticket by barcode
    const ticket = await utils.client.tickets.getByBarcode.query({ barcode, eventId });
    
    if (!ticket) return { status: "not_found", barcode };
    if (ticket.status === "voided") return { status: "voided", attendeeName: ticket.attendeeName ?? "Guest", barcode };
    
    // Attempt check-in via the guestId on the ticket
    if (!ticket.guestId) {
      // No linked guest — check in via barcode only
      return { status: "success", attendeeName: ticket.attendeeName ?? "Guest", ticketType: ticket.ticketTypeName ?? "Ticket", barcode };
    }

    const result = await checkInMutation.mutateAsync({
      guestId: ticket.guestId,
      eventId,
      barcode,
    });

    if (result.alreadyCheckedIn) {
      return { status: "already_checked_in", attendeeName: ticket.attendeeName ?? "Guest", barcode };
    }

    return {
      status: "success",
      attendeeName: ticket.attendeeName ?? "Guest",
      ticketType: ticket.ticketTypeName ?? "Ticket",
      barcode,
    };
  };

  // Derived Stats
  const totalGuests = guests.length;
  const checkedInCount = guests.filter((g) => g.status === "checked_in").length;
  const percentage = Math.round((checkedInCount / totalGuests) * 100) || 0;

  // Search & Filter
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const guestStatus = guest.status === "checked_in" ? "checked_in" : "pending";
      if (filter !== "all" && guestStatus !== filter) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const name = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.toLowerCase();
      return (
        name.includes(query) ||
        (guest.email ?? "").toLowerCase().includes(query) ||
        (guest.guestType ?? "").toLowerCase().includes(query)
      );
    });
  }, [guests, searchQuery, filter]);

  const toggleCheckIn = async (guestId: string) => {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;

    const isCheckedIn = guest.status === "checked_in";
    const displayName = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim() || "Guest";

    if (!isCheckedIn) {
      try {
        await checkInMutation.mutateAsync({ guestId, eventId });
        toast.success(`${displayName} checked in`, {
          icon: "👋",
          action: {
            label: "Undo",
            onClick: async () => {
              await undoMutation.mutateAsync({ guestId, eventId });
              toast(`${displayName} check-in was undone.`);
            },
          },
        });
      } catch {
        toast.error("Check-in failed. Please try again.");
      }
    } else {
      try {
        await undoMutation.mutateAsync({ guestId, eventId });
        toast(`${displayName} checked out`);
      } catch {
        toast.error("Undo failed. Please try again.");
      }
    }
  };

  const simulateScan = () => {
    const pendingGuests = guests.filter((g) => g.status !== "checked_in");
    if (pendingGuests.length === 0) {
      toast.error("All guests have been checked in!");
      return;
    }
    const randomGuest = pendingGuests[Math.floor(Math.random() * pendingGuests.length)];
    toggleCheckIn(randomGuest.id);
  };

  const isMutating = checkInMutation.isPending || undoMutation.isPending;

  return (
    <>
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      
      {/* TOP APP BAR */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-zinc-900 z-10">
        
        {/* Left */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground md:flex">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">
              Check-in
            </h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1">
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wifi className="h-3 w-3 text-green-500" />
                )}
                {isLoading ? "Syncing..." : "Online"}
              </span>
              <span>•</span>
              <span>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Stats */}
        <div className="hidden flex-col items-center justify-center sm:flex max-w-[200px] w-full">
          <div className="flex w-full items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arrivals</span>
            <span className="text-xs font-bold text-primary">{checkedInCount} / {totalGuests}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden lg:flex gap-2">
            <UserPlus className="h-4 w-4" /> Guest
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setScannerOpen(true)}
            disabled={isMutating || isLoading}
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Scan QR</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={simulateScan}
            disabled={isMutating || isLoading}
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Simulate</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-muted">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Door Staff (iPad 1)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => refetch()}>
                <Wifi className="mr-2 h-4 w-4" /> Sync Now
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                Exit Check-in Mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col gap-3 border-b bg-white p-4 dark:bg-zinc-900 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            autoFocus
            placeholder="Search by name, email, or ticket type..." 
            className="h-12 pl-10 text-base shadow-inner bg-zinc-50 dark:bg-zinc-950 focus-visible:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "pending", "checked_in"] as const).map((f) => {
            const count = f === "all" ? totalGuests : f === "checked_in" ? checkedInCount : totalGuests - checkedInCount;
            return (
              <Badge 
                key={f}
                variant={filter === f ? "default" : "secondary"}
                className={cn(
                  "h-10 cursor-pointer px-4 text-sm whitespace-nowrap",
                  f === "pending" && filter !== "pending" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                  f === "checked_in" && filter !== "checked_in" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                )}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "checked_in" ? "Checked In" : "Pending"} ({count})
              </Badge>
            );
          })}
        </div>
      </div>

      {/* GUEST LIST & SIDEBAR */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Main Guest Roster */}
        <ScrollArea className="flex-1 bg-zinc-50 dark:bg-zinc-950 px-2 lg:px-4 py-4">
          <div className="mx-auto max-w-4xl space-y-2 pb-16">
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
                <p>Loading guest list...</p>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Search className="mb-4 h-12 w-12 opacity-20" />
                <p className="text-lg font-medium text-foreground">No guests found</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredGuests.map((guest) => {
                const isCheckedIn = guest.status === "checked_in";
                const displayName = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim() || "Guest";
                const checkInTime = guest.checkedInAt 
                  ? format(new Date(guest.checkedInAt), "h:mm a")
                  : null;
                
                return (
                  <div 
                    key={guest.id}
                    onClick={() => !isMutating && toggleCheckIn(guest.id)}
                    className={cn(
                      "group flex cursor-pointer items-center justify-between rounded-xl border bg-white p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:bg-zinc-900 sm:p-4",
                      isCheckedIn && "border-green-200 bg-green-50/30 dark:border-green-900/50 dark:bg-green-900/10"
                    )}
                  >
                    {/* Left: Avatar & Name */}
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      <div className={cn(
                        "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full text-base sm:text-lg font-bold transition-colors",
                        isCheckedIn 
                          ? "bg-green-500 text-white shadow-inner" 
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        {isCheckedIn ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base sm:text-lg font-semibold leading-tight">
                            {displayName}
                          </h3>
                          {guest.tableNumber && (
                            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] h-5 px-1.5 uppercase bg-zinc-50 dark:bg-zinc-800">
                              {guest.tableNumber}
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs sm:text-sm text-muted-foreground mt-0.5">
                          {guest.guestType ?? "Guest"}{guest.email ? ` • ${guest.email}` : ""}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right: Status & Button */}
                    <div className="flex shrink-0 items-center gap-3 sm:gap-4 ml-2">
                      <div className="hidden flex-col items-end sm:flex text-right min-w-[90px]">
                        <span className={cn(
                          "text-sm font-bold",
                          isCheckedIn ? "text-green-600 dark:text-green-400" : "text-zinc-400 dark:text-zinc-500"
                        )}>
                          {isCheckedIn ? "Checked In" : "Pending"}
                        </span>
                        {isCheckedIn && checkInTime && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {checkInTime}
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        variant={isCheckedIn ? "ghost" : "default"}
                        size="sm" 
                        className={cn(
                          "h-8 sm:h-10 shrink-0 w-[80px] sm:w-[100px] transition-all",
                          isCheckedIn ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50" : "shadow-sm group-hover:bg-primary/90"
                        )}
                        disabled={isMutating}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCheckIn(guest.id);
                        }}
                      >
                        {isCheckedIn ? "Undo" : "Check In"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
            
          </div>
        </ScrollArea>
        
        {/* Right Sidebar: Recent Activity (Desktop only) */}
        <div className="hidden w-72 flex-col border-l bg-white dark:bg-zinc-900 lg:flex shrink-0">
          <div className="flex h-12 items-center px-4 border-b font-medium shadow-sm z-10">
            <h3 className="text-sm">Recent Activity</h3>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {guests
                .filter((g) => g.status === "checked_in" && g.checkedInAt)
                .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
                .slice(0, 20)
                .map((g, i, arr) => (
                  <div key={`${g.id}_log`} className="relative flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      {i < arr.length - 1 && (
                        <div className="h-full mt-1 w-[2px] bg-border/50" />
                      )}
                    </div>
                    <div className="flex flex-col pb-4">
                      <span className="text-sm font-medium leading-none">
                        {`${g.firstName ?? ""} ${g.lastName ?? ""}`.trim()}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">{g.guestType ?? "Guest"}</span>
                      <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {g.checkedInAt ? format(new Date(g.checkedInAt), "h:mm a") : ""}
                      </span>
                    </div>
                  </div>
                ))}

              {checkedInCount === 0 && (
                <p className="text-xs text-center text-muted-foreground mt-10">No check-ins yet.</p>
              )}
            </div>
          </ScrollArea>
        </div>

      </div>
    </div>

    {/* QR Scanner Modal - fullscreen overlay */}
    <QRScannerModal
      open={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScan={handleBarcodeScan}
    />
  </>
  );
}

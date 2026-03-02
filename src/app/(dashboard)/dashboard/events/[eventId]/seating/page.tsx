"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Armchair, 
  Users, 
  Search, 
  ChevronRight, 
  MoreVertical,
  UserPlus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { GuestModal } from "@/components/guests/GuestModal";
import type { Guest } from "@/types/guest";

export default function SeatingPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, refetch } = trpc.guests.list.useQuery({ eventId });
  const guests = useMemo(() => data?.guests ?? [], [data]);

  // Group guests by table
  const tableGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    guests.forEach((guest: any) => {
      const table = guest.tableNumber || "Unassigned";
      if (!groups[table]) groups[table] = [];
      groups[table].push(guest);
    });
    return groups;
  }, [guests]);

  const tables = Object.entries(tableGroups).sort(([a], [b]) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const filteredTables = tables.filter(([tableName, members]) => {
    if (!search) return true;
    return (
      tableName.toLowerCase().includes(search.toLowerCase()) ||
      members.some(m => 
        m.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        m.lastName?.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  const totalGuests = guests.length;
  const assignedGuests = guests.filter(g => g.tableNumber).length;
  const unassignedGuests = totalGuests - assignedGuests;
  const assignmentPercentage = totalGuests > 0 ? (assignedGuests / totalGuests) * 100 : 0;

  const toModalGuest = (guest: any): Guest => ({
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    status: guest.status,
    guestType: guest.guestType,
    tableNumber: guest.tableNumber,
    seatNumber: guest.seatNumber,
    tags: guest.tags ?? null,
    notes: guest.notes,
    source: guest.source ?? "manual",
    checkedInAt: guest.checkedInAt ?? null,
    createdAt: guest.createdAt,
  });

  return (
    <div className="space-y-8 container py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Link href={`/dashboard/events/${eventId}`} className="hover:text-primary transition-colors">Events</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Seating</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Table & Seat Assignments</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Organize your venue layout and track capacity. Drag and drop guests into tables to finalize your seating plan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="rounded-2xl border-2 px-6">
            Download Floor Plan
          </Button>
          <Button size="lg" className="rounded-2xl px-6 shadow-xl shadow-primary/20 gap-2" onClick={() => {
            setSelectedGuest(null);
            setIsModalOpen(true);
          }}>
            <UserPlus className="h-4 w-4" /> Add Guest
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="p-8 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Venue Overview</CardTitle>
                <CardDescription>Visualizing {tables.length} tables across the venue</CardDescription>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search table or guest..." 
                  className="pl-10 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none focus-visible:ring-1"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTables.map(([tableName, members]) => (
                <div 
                  key={tableName} 
                  className="group rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-white dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Armchair className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{tableName}</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{members.length} Guests Occupied</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {members.slice(0, 4).map((m) => (
                      <div 
                        key={m.id} 
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedGuest(m);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                            {m.firstName?.[0]}{m.lastName?.[0]}
                          </div>
                          <span className="text-sm font-medium">{m.firstName} {m.lastName}</span>
                        </div>
                        {m.seatNumber && (
                          <Badge variant="outline" className="text-[10px] font-bold uppercase border-none bg-zinc-100 dark:bg-zinc-800">
                            Seat {m.seatNumber}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <button className="w-full py-2 text-xs font-bold text-primary hover:underline transition-all">
                        + {members.length - 4} more guests
                      </button>
                    )}
                    {members.length === 0 && (
                      <div className="py-8 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-2xl">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Empty Table</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-xl bg-primary text-primary-foreground overflow-hidden h-fit">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8" />
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">Live Status</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Assignment Progress</p>
                <div className="text-4xl font-black">{assignedGuests} / {totalGuests}</div>
              </div>
              <div className="space-y-2">
                <Progress value={assignmentPercentage} className="h-3 bg-white/20" />
                <p className="text-[10px] text-right font-bold uppercase tracking-tighter opacity-80">
                  {Math.round(assignmentPercentage)}% Capacity Allocated
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-lg">Unassigned Audience</CardTitle>
              <CardDescription>{unassignedGuests} guests needing a table</CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {guests.filter(g => !g.tableNumber || g.tableNumber === "Unassigned").map(g => (
                  <div 
                    key={g.id} 
                    className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group cursor-move"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {g.firstName?.[0]}{g.lastName?.[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{g.firstName} {g.lastName}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{g.guestType || "Standard"}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full group-hover:bg-primary group-hover:text-white transition-all" onClick={() => {
                      setSelectedGuest(toModalGuest(g));
                      setIsModalOpen(true);
                    }}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {unassignedGuests === 0 && (
                  <div className="p-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="font-bold">Fully Allocated!</p>
                    <p className="text-xs text-muted-foreground mt-1">Every guest has a reserved seat.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <GuestModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventId={eventId}
        guest={selectedGuest}
        onSuccess={refetch}
      />
    </div>
  );
}

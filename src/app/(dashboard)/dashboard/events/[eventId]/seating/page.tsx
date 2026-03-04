"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Armchair, 
  Users, 
  Search, 
  ChevronRight, 
  MoreVertical,
  UserPlus,
  Activity,
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { GuestModal } from "@/components/guests/GuestModal";
import type { Guest } from "@/types/guest";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SeatingPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, refetch } = trpc.guests.list.useQuery({ eventId });
  const guests = useMemo(() => data?.guests ?? [], [data]);

  const tableGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    guests.forEach((guest: any) => {
      const table = guest.tableNumber || "UNASSIGNED";
      if (!groups[table]) groups[table] = [];
      groups[table].push(guest);
    });
    return groups;
  }, [guests]);

  const tables = Object.entries(tableGroups).sort(([a], [b]) => {
    if (a === "UNASSIGNED") return 1;
    if (b === "UNASSIGNED") return -1;
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
  const assignedGuests = guests.filter(g => g.tableNumber && g.tableNumber !== "UNASSIGNED").length;
  const unassignedGuests = totalGuests - assignedGuests;
  const assignmentPercentage = totalGuests > 0 ? (assignedGuests / totalGuests) * 100 : 0;

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all group">
              <ChevronRight className="h-6 w-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Venue</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
               <Activity className="h-3 w-3 text-primary animate-pulse" />
               Spatial Allocation Strategy
            </p>
          </motion.div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white/60 hover:text-white font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3">
            Floor Plan EXPORT
          </Button>
          <Button className="h-12 px-8 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 font-black italic uppercase tracking-widest text-[10px] flex gap-3 transition-all hover:scale-105 active:scale-95" onClick={() => { setSelectedGuest(null); setIsModalOpen(true); }}>
            <UserPlus className="h-5 w-5" /> Add Registry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Venue Grid */}
        <div className="lg:col-span-3 space-y-10">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search tactical zone or unit..." 
              className="h-14 pl-16 pr-6 rounded-2xl bg-white/5 border-white/10 text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredTables.map(([tableName, members], i) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={tableName} 
                  className="group rounded-[40px] bg-white/5 border border-white/10 p-10 hover:bg-white/8 transition-all relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-start justify-between mb-10">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110 duration-500">
                        <Armchair className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">{tableName}</h3>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">{members.length} UNITS ASSIGNED</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-white hover:bg-white/5 rounded-xl border border-white/5">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 relative z-10">
                    {members.slice(0, 5).map((m) => (
                      <div 
                        key={m.id} 
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/2 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group/item"
                        onClick={() => { setSelectedGuest(m); setIsModalOpen(true); }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white/3 flex items-center justify-center font-black italic text-[10px] text-white/40 border border-white/5 group-hover/item:text-white transition-colors">
                            {m.firstName?.[0]}{m.lastName?.[0]}
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-white italic truncate uppercase tracking-tight group-hover/item:text-primary transition-colors leading-none mb-1">{m.firstName} {m.lastName}</p>
                             <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest font-mono">ID: {m.id.split('-')[0]}</p>
                          </div>
                        </div>
                        {m.seatNumber && (
                          <span className="text-[10px] font-black text-primary italic uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 tracking-widest">
                             S-{m.seatNumber}
                          </span>
                        )}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <button className="w-full py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-primary hover:tracking-[0.4em] transition-all italic mt-4">
                        + {members.length - 5} ADDITIONAL UNITS
                      </button>
                    )}
                    {members.length === 0 && (
                      <div className="py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[32px]">
                        <Target className="h-10 w-10 text-white/5 mx-auto" />
                        <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">ZERO ALLOCATION</p>
                      </div>
                    )}
                  </div>
                  <div className="absolute right-0 bottom-0 h-32 w-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-8">
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="p-8 rounded-[40px] bg-primary text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="relative z-10 space-y-10">
               <div className="flex items-center justify-between">
                  <Activity className="h-10 w-10 text-white/40 animate-pulse" />
                  <Badge className="bg-white/10 text-white border-none backdrop-blur-md px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest italic">LIVE GRID</Badge>
               </div>
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">Global Allocation</p>
                  <div className="text-5xl font-black italic tracking-tighter leading-none">{assignedGuests} <span className="text-xl opacity-30">/ {totalGuests}</span></div>
               </div>
               <div className="space-y-4">
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                     <motion.div 
                       initial={{ width: 0 }} 
                       animate={{ width: `${assignmentPercentage}%` }} 
                       className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                     />
                  </div>
                  <p className="text-[10px] text-right font-black uppercase tracking-widest italic opacity-60">
                     {Math.round(assignmentPercentage)}% CAPACITY VERIFIED
                  </p>
               </div>
            </div>
            <div className="absolute -right-10 -top-10 h-48 w-48 bg-white/10 rounded-full blur-3xl" />
          </motion.div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-[40px] bg-white/5 border border-white/10 overflow-hidden backdrop-blur-xl">
             <div className="p-8 border-b border-white/5 bg-white/2">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Queue</h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">{unassignedGuests} UNASSIGNED UNITS</p>
             </div>
             <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-white/5">
                  {guests.filter(g => !g.tableNumber || g.tableNumber === "UNASSIGNED").map(g => (
                    <div 
                      key={g.id} 
                      className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-move"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/3 flex items-center justify-center font-black italic text-sm text-white/40 border border-white/5 group-hover:text-primary transition-colors">
                          {g.firstName?.[0]}{g.lastName?.[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white uppercase tracking-tight italic leading-none mb-1 group-hover:text-primary transition-colors">{g.firstName} {g.lastName}</span>
                          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{g.guestType || "STANDARD"}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-white hover:bg-primary rounded-xl transition-all" onClick={() => {
                        setSelectedGuest(g);
                        setIsModalOpen(true);
                      }}>
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                  {unassignedGuests === 0 && (
                    <div className="p-20 text-center space-y-6">
                      <div className="h-16 w-16 rounded-[32px] bg-green-500/10 text-green-500 flex items-center justify-center mx-auto transition-transform hover:scale-110">
                        <Users className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">GRID COMPLETE</h4>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">All units allocated to zones</p>
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </motion.div>
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

"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle, LogOut, ScanLine, Search, XCircle, Activity, ChevronRight, Zap, Target } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const checkinV2Enabled = process.env.NEXT_PUBLIC_CHECKIN_APP_V2_ENABLED !== "false";

export default function ArrivalsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<"all" | "check_in" | "checkout" | "invalid">("all");

  const { data, isLoading } = trpc.scans.arrivals.useQuery({
    eventId,
    search: search.trim() ? search : undefined,
    action: action === "all" ? undefined : action,
    limit: 300,
    offset: 0,
  });

  const rows = useMemo(() => data?.scans ?? [], [data?.scans]);
  const totals = useMemo(() => {
    const checkedIn = rows.filter((row) => row.scanType === "check_in").length;
    const checkedOut = rows.filter((row) => row.scanType === "checkout").length;
    const invalid = rows.filter((row) => row.scanType === "invalid").length;
    return { checkedIn, checkedOut, invalid };
  }, [rows]);

  if (!checkinV2Enabled) {
    return (
      <div className="p-20 text-center space-y-6">
        <XCircle className="h-16 w-16 text-white/10 mx-auto" />
        <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Protocol Disabled</h1>
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest max-w-sm mx-auto">
          Arrivals reporting is currently offline. Enable environment sync to initialize.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Arrivals</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Real-time Entry Logistics
          </p>
        </motion.div>
        <Link href={`/checkin/${eventId}`} target="_blank">
          <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
            <ScanLine className="h-6 w-6" />
            Initialize Scanner
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard label="Success Events" value={totals.checkedIn} icon={CheckCircle} color="text-green-400" bg="bg-green-500/10" delay={0} />
        <StatCard label="Departure Relay" value={totals.checkedOut} icon={LogOut} color="text-blue-400" bg="bg-blue-500/10" delay={0.1} />
        <StatCard label="Threat Flags" value={totals.invalid} icon={XCircle} color="text-red-400" bg="bg-red-500/10" delay={0.2} />
      </div>

      {/* Filter Hub */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center justify-between">
        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
          <Input
            className="h-14 pl-16 pr-6 rounded-2xl bg-white/5 border-white/10 text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary focus:border-primary transition-all"
            placeholder="Search operational data stream..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          {(["all", "check_in", "checkout", "invalid"] as const).map((item) => (
            <Button
              key={item}
              variant="ghost"
              size="sm"
              onClick={() => setAction(item)}
              className={cn(
                "h-10 px-6 rounded-xl font-black italic uppercase tracking-widest text-[9px] transition-all",
                action === item ? "bg-primary text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {item === "all" ? "Global" : item.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-[40px] bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 gap-6 px-10 py-6 border-b border-white/5 bg-white/2">
          <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-white/30">Timestamp</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-white/30">Intelligence</div>
          <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-white/30">Target Profile</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-white/30">Hardware</div>
          <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Verification</div>
        </div>

        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="p-20 text-center space-y-4">
               <Activity className="h-10 w-10 text-primary mx-auto animate-spin" />
               <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Synchronizing stream...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-24 text-center space-y-6">
              <Target className="h-16 w-16 text-white/5 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Zero Match Frequency</h4>
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Awaiting sensor data for this filter</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {rows.map((row, i) => {
                const attendee = row.attendeeName || `${row.guestFirstName ?? ""} ${row.guestLastName ?? ""}`.trim() || "ANON UNIT";
                const when = new Date(row.scannedAt);
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={row.id} 
                    className="grid grid-cols-12 gap-6 px-10 py-6 items-center hover:bg-white/3 transition-colors group"
                  >
                    <div className="col-span-3">
                      <p className="text-sm font-black text-white italic tracking-tighter leading-none mb-1">{format(when, "HH:mm:ss")}</p>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{format(when, "MMM d, yyyy")}</p>
                    </div>
                    <div className="col-span-2">
                      {row.scanType === "check_in" ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 font-black text-[9px] uppercase italic tracking-widest">ENTRY</Badge>
                      ) : row.scanType === "checkout" ? (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full px-4 font-black text-[9px] uppercase italic tracking-widest">EXIT</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 rounded-full px-4 font-black text-[9px] uppercase italic tracking-widest">REJECTED</Badge>
                      )}
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center font-black italic text-[9px] text-white/40 border border-white/5">
                           {attendee[0]}
                        </div>
                        <div>
                           <p className="font-black text-white italic tracking-tight uppercase leading-none mb-1 group-hover:text-primary transition-colors">{attendee}</p>
                           <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest font-mono italic">{row.barcode ?? "NO-ASSET-ID"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                       <p className="text-[10px] font-black text-white italic tracking-tight uppercase leading-none mb-1">{row.deviceName || "CMD-CENTER"}</p>
                       <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{row.method}</p>
                    </div>
                    <div className="col-span-2 text-right">
                       <p className="text-[10px] font-black text-white/40 italic uppercase tracking-tighter leading-none">{row.result || "SUCCESS"}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, delay }: any) {
  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay }} className="p-8 rounded-[32px] bg-white/5 border border-white/10 group hover:bg-white/8 transition-all flex flex-col justify-center gap-4 relative overflow-hidden">
       <div className="relative z-10 space-y-4">
          <div className={cn("p-3 w-fit rounded-2xl", bg, color)}>
             <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{value}</h3>
          </div>
       </div>
    </motion.div>
  );
}

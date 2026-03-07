"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ExternalLinkIcon, Plus, Zap, Users, Ticket, Activity, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MODY_COLORS = ["#ff5f52", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

export default function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });
  const { data: guestStats } = trpc.guests.stats.useQuery({ eventId });
  const { data: ticketTypeStats } = trpc.ticketTypes.stats.useQuery({ eventId });
  const { data: experience } = trpc.eventExperience.get.useQuery({ eventId });

  if (isLoading) {
    return (
      <div className="space-y-12 px-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-14 w-64 rounded-2xl bg-white/5" />
          <Skeleton className="h-14 w-40 rounded-2xl bg-white/5" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[450px] w-full rounded-[40px] bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!event) {
    return <div className="p-20 text-center text-muted-foreground dark:text-white/40 font-black italic uppercase tracking-widest">Event Not Found</div>;
  }

  const emailData = [
    { name: "Delivered", value: 75, count: 0 },
    { name: "Failed", value: 5, count: 0 },
    { name: "Deferred", value: 20, count: 0 },
  ];

  const sourceData = [
    { name: "Imported", value: guestStats?.total ?? 0, count: guestStats?.total ?? 0 },
    { name: "Manual", value: 0, count: 0 },
  ];

  const deliveryData = [
    { name: "Sent", value: ticketTypeStats?.totalSold ?? 0, count: ticketTypeStats?.totalSold ?? 0 },
    { name: "Unsent", value: 0, count: 0 },
  ];

  const totalGuests = guestStats?.total ?? 0;
  const capacity = event.maxCapacity ?? 1000;
  const occupancyRate = totalGuests > 0 ? (totalGuests / capacity) * 100 : 0;
  const analyticsCardClass =
    "flex flex-col rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 overflow-hidden group hover:bg-muted/60 dark:hover:bg-white/8 transition-all h-[480px]";
  const panelClass =
    "rounded-[40px] border border-border dark:border-white/10 bg-card/90 dark:bg-white/5";
  const publicPageEnabled =
    typeof (event.settings as { publicPage?: { enabled?: boolean } } | null)?.publicPage?.enabled === "boolean"
      ? (event.settings as { publicPage?: { enabled?: boolean } }).publicPage?.enabled !== false
      : true;
  const canOpenPublicEventPage =
    event.registrationEnabled && !!event.companySlug && event.status === "published" && publicPageEnabled;

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-foreground dark:text-white italic tracking-tighter uppercase">{event.title}</h1>
          <p className="text-muted-foreground dark:text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary animate-pulse" />
            Live Event Overview
          </p>
        </motion.div>
        <div className="flex items-center gap-4">
          {event.registrationEnabled && (
            canOpenPublicEventPage ? (
              <Button
                asChild
                variant="outline"
                className="theme-ghost-surface h-14 px-6 rounded-2xl font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3"
              >
                <Link href={`/e/${event.companySlug}/${event.slug}`} target="_blank" rel="noreferrer">
                  Event Page <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="theme-ghost-surface h-14 px-6 rounded-2xl font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3"
              >
                {event.status !== "published" ? "Publish Event First" : "Event Page Unavailable"} <ExternalLink className="h-4 w-4" />
              </Button>
            )
          )}
          <Button
            asChild
            className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3"
          >
            <Link href={`/dashboard/events/${event.id}/guests`}>
              <Plus className="h-6 w-6" />
              Add Guest
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Analytics Card Template */}
        {[
          { title: "Email Activity", sub: "Campaign delivery", data: emailData, type: "pie" },
          { title: "Guest Sources", sub: "How guests were added", data: sourceData, type: "pie", colorOffset: 1 },
          { title: "Ticket Delivery", sub: "Sent vs pending tickets", data: deliveryData, type: "pie", colorOffset: 2 },
          { title: "Capacity", sub: "Current event occupancy", data: [], type: "load" }
        ].map((block, i) => (
          <motion.div
            key={block.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={analyticsCardClass}
          >
            <div className="border-b border-border/70 bg-muted/20 p-8 dark:border-white/5 dark:bg-white/2">
              <h3 className="mb-1 text-lg font-black text-foreground dark:text-white italic leading-none uppercase tracking-tighter">{block.title}</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 dark:text-white/20">{block.sub}</p>
            </div>
            
            <div className="flex-1 p-8 flex flex-col justify-between">
               {block.type === "pie" ? (
                 <>
                   <div className="h-[180px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={block.data}
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {block.data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={MODY_COLORS[(index + (block.colorOffset || 0)) % MODY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0a0b1e', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              borderRadius: '16px',
                              fontSize: '10px',
                              fontWeight: '900',
                              color: 'white',
                              textTransform: 'uppercase'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                         <TrendingUp className="h-6 w-6 text-primary mb-1" />
                         <span className="text-[10px] font-black text-foreground dark:text-white italic">73%</span>
                      </div>
                   </div>
                   
                   <div className="space-y-3 mt-8">
                     {block.data.map((item, idx) => (
                       <div key={item.name} className="flex items-center justify-between group/row">
                          <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODY_COLORS[(idx + (block.colorOffset || 0)) % MODY_COLORS.length] }} />
                             <span className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-widest group-hover/row:text-foreground dark:group-hover/row:text-white transition-colors">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-foreground dark:text-white italic">{item.count}</span>
                            <Button variant="ghost" className="h-6 w-6 rounded-lg p-0 text-muted-foreground/40 dark:text-white/10 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5">
                              <ExternalLinkIcon className="h-3 w-3" />
                            </Button>
                          </div>
                       </div>
                     ))}
                   </div>
                 </>
               ) : (
                 <div className="h-full flex flex-col justify-center space-y-12">
                   <div className="space-y-6">
                      <div className="flex justify-between items-end">
                         <p className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-widest">Real-time Load</p>
                         <p className="text-4xl font-black text-foreground dark:text-white italic leading-none">{totalGuests} <span className="text-sm text-muted-foreground dark:text-white/20">/ {capacity}</span></p>
                      </div>
                      <div className="h-4 overflow-hidden rounded-full border border-border bg-muted dark:border-white/5">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${occupancyRate}%` }}
                           className="h-full bg-linear-to-r from-primary to-primary/40 rounded-full shadow-[0_0_20px_rgba(255,95,82,0.3)]"
                         />
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground/60 dark:text-white/10 uppercase tracking-widest text-center">Occupancy rate: {occupancyRate.toFixed(1)}%</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-3xl border border-border bg-muted/40 p-4 dark:border-white/5 dark:bg-white/3">
                         <p className="text-[8px] font-black text-muted-foreground/70 dark:text-white/20 uppercase tracking-widest mb-1">Revenue</p>
                         <p className="text-xl font-black text-primary italic">$0.00</p>
                      </div>
                      <div className="rounded-3xl border border-border bg-muted/40 p-4 dark:border-white/5 dark:bg-white/3">
                         <p className="text-[8px] font-black text-muted-foreground/70 dark:text-white/20 uppercase tracking-widest mb-1">Growth</p>
                         <p className="text-xl font-black text-green-400 italic">+12%</p>
                      </div>
                   </div>
                 </div>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Hub */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-3"
      >
        {[ 
          { title: "Import Guests", icon: Plus, desc: "Upload a CSV or add guests in bulk.", action: "Import Guests" },
          { title: "Ticket Types", icon: Ticket, desc: "Manage admission tiers, pricing, and inventory.", action: "Manage Tickets" },
          { title: "Check-in Activity", icon: Activity, desc: "Review check-in and checkout activity for this event.", action: "View Check-ins" }
        ].map((hub, i) => (
          <div key={hub.title} className="theme-panel group relative space-y-8 overflow-hidden p-10 hover:border-primary/30 hover:bg-muted/60 dark:hover:bg-white/8">
            <div className="relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-6">
                 <hub.icon className="h-7 w-7" />
              </div>
              <h4 className="mb-4 text-2xl font-black text-foreground dark:text-white italic tracking-tighter uppercase">{hub.title}</h4>
              <p className="mb-8 text-[10px] font-bold text-muted-foreground dark:text-white/30 uppercase tracking-widest leading-relaxed">
                {hub.desc}
              </p>
              <Button className="h-14 w-full rounded-2xl border border-border bg-muted/40 text-foreground transition-all font-black italic uppercase tracking-widest text-xs group-hover:bg-primary group-hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white">
                 {hub.action}
              </Button>
            </div>
            <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-3">
        <div className={cn(panelClass, "p-8")}>
          <h3 className="text-xl font-black text-foreground dark:text-white italic uppercase tracking-tighter">Attendee App</h3>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/30">
            {experience?.settings.homeHeadline ?? "Your live event companion"}
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground dark:text-white/60">
            <div>Networking enabled: {experience?.settings.features.networkingEnabled ? "Yes" : "No"}</div>
            <div>Push enabled: {experience?.settings.features.pushNotificationsEnabled ? "Yes" : "No"}</div>
            <div>Live stream: {experience?.settings.liveStream.url ? "Configured" : "Not configured"}</div>
          </div>
        </div>
        <div className={cn(panelClass, "p-8")}>
          <h3 className="text-xl font-black text-foreground dark:text-white italic uppercase tracking-tighter">Sessions</h3>
          <p className="mt-6 text-4xl font-black italic text-foreground dark:text-white">{experience?.sessions.length ?? 0}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/30">
            {experience?.sessions.filter((session) => session.liveNow).length ?? 0} live right now
          </p>
        </div>
        <div className={cn(panelClass, "p-8")}>
          <h3 className="text-xl font-black text-foreground dark:text-white italic uppercase tracking-tighter">Networking</h3>
          <p className="mt-6 text-4xl font-black italic text-foreground dark:text-white">{experience?.networkingSummary.optedInCount ?? 0}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/30">
            opted in attendees
          </p>
        </div>
      </motion.div>
    </div>
  );
}

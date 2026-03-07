"use client";

import Link from "next/link";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import {
  CalendarDays,
  Users,
  Ticket,
  CheckCircle,
  ArrowRight,
  Plus,
  TrendingUp,
  Clock,
  Upload,
  UserPlus,
  ScanLine,
  BarChart3,
  ChevronRight,
  Activity,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: eventStats, isLoading: eventsLoading } = trpc.events.stats.useQuery();
  const { data: upcomingEvents, isLoading: upcomingLoading } = trpc.events.list.useQuery({
    status: "published",
    limit: 5,
    offset: 0,
  });

  const totalEvents = eventStats?.total ?? 0;
  const totalGuests = eventStats?.totalGuests ?? 0;
  const totalCheckIns = eventStats?.totalCheckIns ?? 0;

  const stats = [
    {
      title: "Total Events",
      value: eventsLoading ? "—" : totalEvents.toString(),
      icon: CalendarDays,
      sub: "Active and archived",
      delay: 0
    },
    {
      title: "Total Guests",
      value: eventsLoading ? "—" : totalGuests.toString(),
      icon: Users,
      sub: "Across all rosters",
      delay: 0.1
    },
    {
      title: "Verified Entries",
      value: eventsLoading ? "—" : totalCheckIns.toString(),
      icon: CheckCircle,
      sub: "Real-time verification",
      delay: 0.2
    },
    {
      title: "Active Capacity",
      value: "84%",
      icon: TrendingUp,
      sub: "Engagement rate",
      delay: 0.3
    },
  ];

  const setupSteps = [
    {
      number: 1,
      title: "Create Event",
      description: "Define venue, date, and core parameters.",
      href: "/dashboard/events/new",
      icon: CalendarDays,
      done: totalEvents > 0,
    },
    {
      number: 2,
      title: "Import Roster",
      description: "Sync your guest data via CSV or integration.",
      href: "/dashboard/events",
      icon: Upload,
      done: totalGuests > 0,
    },
    {
      number: 3,
      title: "Design Assets",
      description: "Craft premium PDF tickets and visual IDs.",
      href: "/dashboard/tickets",
      icon: Ticket,
      done: false,
    },
    {
      number: 4,
      title: "Live Scan",
      description: "Execute high-velocity entry management.",
      href: "/dashboard/events",
      icon: ScanLine,
      done: totalCheckIns > 0,
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-foreground dark:text-white italic tracking-tighter uppercase">Operations</h1>
          <p className="text-muted-foreground dark:text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Central Intelligence Dashboard
          </p>
        </motion.div>
        <Link href="/dashboard/events/new">
          <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
            <Plus className="h-6 w-6" />
            New Deployment
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: stat.delay }}
            className="group relative overflow-hidden rounded-[32px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-8 transition-all hover:bg-muted/60 dark:hover:bg-white/8"
          >
            <div className="relative z-10">
              <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform duration-500">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/30 mb-1">{stat.title}</p>
              <h2 className="text-3xl font-black text-foreground dark:text-white italic tracking-tight">{stat.value}</h2>
              <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/10 uppercase tracking-tighter mt-4">{stat.sub}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-10 lg:col-span-2">
          {/* Progress Guide */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-10 relative overflow-hidden"
          >
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-foreground dark:text-white italic leading-none mb-2">Command Center Setup</h3>
                  <p className="text-muted-foreground dark:text-white/30 text-[10px] font-bold uppercase tracking-widest">Initialize your operational workspace</p>
                </div>
                <Badge className="bg-primary/20 text-primary border-none rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest">
                  {completedSteps}/{setupSteps.length} Verified
                </Badge>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {setupSteps.map((step, i) => (
                  <Link key={step.number} href={step.href}>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "p-6 rounded-3xl border transition-all h-full group flex items-start gap-4",
                        step.done 
                          ? "bg-green-500/5 border-green-500/20" 
                          : "bg-card/60 dark:bg-white/3 border-border dark:border-white/5 hover:bg-muted/60 dark:hover:bg-white/5 hover:border-border dark:hover:border-white/10"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-12",
                        step.done ? "bg-green-500 text-white" : "bg-primary text-white"
                      )}>
                        {step.done ? <CheckCircle className="h-5 w-5" /> : <span className="font-black italic">{step.number}</span>}
                      </div>
                      <div>
                        <h4 className={cn("font-black italic text-sm mb-1 uppercase tracking-tight", step.done ? "text-green-500 dark:text-green-400" : "text-foreground dark:text-white")}>
                          {step.title}
                        </h4>
                        <p className="text-[10px] font-bold text-muted-foreground dark:text-white/30 leading-relaxed uppercase tracking-tighter">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 overflow-hidden"
          >
            <div className="p-8 border-b border-border dark:border-white/5 flex items-center justify-between bg-muted/30 dark:bg-white/2 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-black text-foreground dark:text-white italic leading-none mb-2">Deployment Schedule</h3>
                <p className="text-muted-foreground dark:text-white/30 text-[10px] font-bold uppercase tracking-widest">Upcoming active operations</p>
              </div>
              <Link href="/dashboard/events">
                <Button variant="ghost" className="h-10 px-4 rounded-xl text-muted-foreground dark:text-white/20 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5 font-black text-[10px] uppercase tracking-widest flex gap-2 group">
                  Global View <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="p-4">
              {upcomingLoading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-muted dark:bg-white/5" />)}
                </div>
              ) : !upcomingEvents?.events?.length ? (
                <div className="p-16 text-center space-y-6">
                  <div className="h-20 w-20 rounded-[32px] bg-muted dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center mx-auto text-muted-foreground/40 dark:text-white/10">
                    <CalendarDays className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-foreground dark:text-white italic uppercase tracking-tighter">No Active Deployments</h4>
                    <p className="text-muted-foreground/70 dark:text-white/20 text-[10px] font-bold uppercase tracking-widest">Awaiting command input</p>
                  </div>
                  <Link href="/dashboard/events/new">
                    <Button className="rounded-2xl bg-card dark:bg-white/10 hover:bg-primary text-foreground dark:text-white border border-border dark:border-white/10 font-black italic uppercase tracking-widest px-8 transition-all">
                      Initialize Operation
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.events.map((event, i) => (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="group flex items-center justify-between p-6 rounded-[24px] bg-card/70 dark:bg-white/3 border border-border dark:border-white/5 hover:bg-muted/60 dark:hover:bg-white/8 transition-all"
                    >
                      <div className="flex items-center gap-6">
                         <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <CalendarDays className="h-7 w-7" />
                         </div>
                         <div>
                           <p className="font-black text-foreground dark:text-white text-lg italic tracking-tight leading-none mb-1">{event.title}</p>
                           <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/20 uppercase tracking-[0.2em]">
                             {format(new Date(event.startsAt), "MMM d, yyyy · HH:mm")}
                           </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                           <p className="text-[9px] font-black text-muted-foreground/70 dark:text-white/10 uppercase tracking-widest mb-1">Status</p>
                           <Badge className="bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/60 border-none font-black text-[9px] uppercase tracking-widest px-3 italic">
                             {event.status}
                           </Badge>
                        </div>
                        <Button variant="ghost" className="h-12 w-12 rounded-2xl p-0 text-muted-foreground/70 dark:text-white/10 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5">
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-10">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-8 space-y-6"
          >
            <h3 className="text-lg font-black text-foreground dark:text-white italic uppercase tracking-tighter ml-2">Flash Actions</h3>
            <div className="grid gap-4">
              {[
                { label: "New Event", href: "/dashboard/events/new", icon: CalendarDays, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Add Roster", href: "/dashboard/contacts", icon: UserPlus, color: "text-purple-400", bg: "bg-purple-400/10" },
                { label: "Studio", href: "/dashboard/tickets", icon: Ticket, color: "text-green-400", bg: "bg-green-400/10" },
                { label: "Reports", href: "/dashboard/reports", icon: BarChart3, color: "text-coral-400", bg: "bg-primary/10" },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="outline" className="w-full h-16 justify-between gap-4 px-6 rounded-2xl bg-card/70 dark:bg-white/3 border-border dark:border-white/5 hover:bg-muted/60 dark:hover:bg-white/8 hover:border-primary/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl", action.bg)}>
                        <action.icon className={cn("h-5 w-5", action.color)} />
                      </div>
                      <span className="font-black italic text-sm text-foreground dark:text-white/80">{action.label}</span>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground/70 dark:text-white/20 group-hover:text-primary transition-colors" />
                  </Button>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
             className="rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-8 space-y-8"
          >
            <div className="flex items-center justify-between ml-2">
              <h3 className="text-lg font-black text-foreground dark:text-white italic uppercase tracking-tighter">Live Feed</h3>
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            </div>
            
            {totalCheckIns > 0 ? (
              <div className="space-y-6">
                <div className="flex gap-4 items-start group">
                   <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-5 w-5" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-sm font-black text-foreground dark:text-white italic">{totalCheckIns} UNITS VERIFIED</p>
                      <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/20 uppercase tracking-widest">Global success rate</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                <Clock className="h-10 w-10 text-muted-foreground/30 dark:text-white/5 mx-auto" />
                <p className="text-[10px] font-black text-muted-foreground/70 dark:text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                  AWAITING REAL-TIME DATA TRANSMISSION
                </p>
              </div>
            )}
          </motion.div>

          {/* Infrastructure */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[40px] bg-linear-to-br from-primary/20 to-transparent border border-primary/30 p-10 relative overflow-hidden"
          >
            <div className="relative z-10 space-y-6">
               <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-foreground dark:text-white italic tracking-tighter uppercase leading-none">Power</h3>
                 <Badge className="bg-primary text-white font-black text-[9px] uppercase border-none px-3">BASIC</Badge>
               </div>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-widest">Resource Usage</p>
                    <p className="text-xl font-black text-foreground dark:text-white italic leading-none">{totalCheckIns} <span className="text-[10px] text-muted-foreground/70 dark:text-white/20">/ 50</span></p>
                 </div>
                 <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalCheckIns / 50) * 100, 100)}%` }}
                      className="h-full bg-primary"
                    />
                 </div>
               </div>

               <Link href="/dashboard/settings" className="block">
                  <Button className="h-14 w-full rounded-2xl bg-card/80 dark:bg-white/5 border border-border dark:border-white/10 text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/10 font-black italic uppercase tracking-widest transition-all">
                    Upgrade Protocol
                  </Button>
               </Link>
            </div>
            <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-primary/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

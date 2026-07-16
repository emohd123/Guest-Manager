"use client";

import Link from "next/link";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  Plus,
  ScanLine,
  Ticket,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { AiToolsCard } from "@/components/dashboard/ai-tools-card";
import { CountUp } from "@/components/visual/reactbits";


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
      value: eventsLoading ? "-" : totalEvents.toString(),
      icon: CalendarDays,
      sub: "Active and archived",
      accentBg: "bg-[rgba(124,58,237,0.15)]",
      accentText: "text-[#a78bfa]",
      delay: 0,
      href: "/dashboard/events",
    },
    {
      title: "Total Guests",
      value: eventsLoading ? "-" : totalGuests.toString(),
      icon: Users,
      sub: "Across all events",
      accentBg: "bg-[rgba(96,165,250,0.15)]",
      accentText: "text-[#60a5fa]",
      delay: 0.1,
      href: "/dashboard/contacts",
    },
    {
      title: "Total Check-Ins",
      value: eventsLoading ? "-" : totalCheckIns.toString(),
      icon: CheckCircle,
      sub: "Checked in across events",
      accentBg: "bg-[rgba(52,211,153,0.15)]",
      accentText: "text-[#34d399]",
      delay: 0.2,
      href: "/dashboard/scans",
    },
    {
      title: "Active Capacity",
      value: "84%",
      icon: TrendingUp,
      sub: "Engagement rate",
      accentBg: "bg-[rgba(244,114,182,0.15)]",
      accentText: "text-[#f472b6]",
      progress: 84,
      delay: 0.3,
      href: "/dashboard/reports",
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
      title: "Import Guests",
      description: "Import your guest list from CSV or an integration.",
      href: "/dashboard/events",
      icon: Upload,
      done: totalGuests > 0,
    },
    {
      number: 3,
      title: "Design Tickets",
      description: "Customize ticket PDFs and guest email designs.",
      href: "/dashboard/tickets",
      icon: Ticket,
      done: false,
    },
    {
      number: 4,
      title: "Check In Guests",
      description: "Use the scanner and check-in tools on event day.",
      href: "/dashboard/events",
      icon: ScanLine,
      done: totalCheckIns > 0,
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-12 px-2 pb-20">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-foreground dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground dark:text-white/40">
            Overview of events, guests, and check-ins
          </p>
        </motion.div>
        <Link href="/dashboard/events/new">
          <Button className="h-14 gap-3 rounded-2xl bg-primary px-8 text-base font-black italic text-white shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95">
            <Plus className="h-6 w-6" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const cardContent = (
            <>
              <div className="relative z-10">
                <div className={cn(
                  "mb-6 w-fit rounded-2xl p-3 transition-transform duration-500 group-hover:scale-110",
                  stat.accentBg,
                  stat.accentText,
                )}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/30">
                  {stat.title}
                </p>
                <h2 className="text-3xl font-black italic tracking-tight text-foreground dark:text-white">
                  {/^\d+$/.test(stat.value) ? <CountUp value={Number(stat.value)} /> : stat.value}
                </h2>
                {stat.progress != null ? (
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ delay: stat.delay + 0.2, duration: 0.9, ease: [0.2, 0.75, 0.2, 1] }}
                      className="h-full rounded-full bg-linear-to-r from-[#7c3aed] to-[#db2777]"
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/70 dark:text-white/10">
                    {stat.sub}
                  </p>
                )}
              </div>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />
            </>
          );

          return (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: stat.delay }}
            >
              <Link
                href={stat.href}
                className="block"
              >
                <SpotlightCard
                  className="group relative overflow-hidden rounded-[32px] border border-border bg-card/90 p-8 transition-all hover:-translate-y-1 hover:bg-muted/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                  spotlightColor="rgba(124, 77, 255, 0.15)"
                >
                  {cardContent}
                </SpotlightCard>
              </Link>

            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
        <AiToolsCard
          stats={{
            totalEvents,
            totalGuests,
            checkIns: totalCheckIns,
            upcomingEvents: upcomingEvents?.events?.length ?? 0,
          }}
        />
      </motion.div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SpotlightCard
              className="relative overflow-hidden rounded-[40px] border border-border bg-card/90 p-10 dark:border-white/10 dark:bg-white/5"
              spotlightColor="rgba(124, 77, 255, 0.12)"
            >


            <div className="relative z-10 space-y-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="mb-2 text-2xl font-black italic leading-none text-foreground dark:text-white">
                    Getting Started
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/30">
                    Set up your first event
                  </p>
                </div>
                <Badge className="rounded-full border-none bg-primary/20 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  {completedSteps}/{setupSteps.length} completed
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {setupSteps.map((step) => (
                  <Link key={step.number} href={step.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group flex h-full items-start gap-4 rounded-3xl border p-6 transition-all",
                        step.done
                          ? "border-green-500/20 bg-green-500/5"
                          : "border-border bg-card/60 hover:border-border hover:bg-muted/60 dark:border-white/5 dark:bg-white/3 dark:hover:border-white/10 dark:hover:bg-white/5",
                      )}
                    >
                      <div
                        className={cn(
                          "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12",
                          step.done ? "bg-green-500 text-white" : "bg-primary text-white",
                        )}
                      >
                        {step.done ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="font-black italic">{step.number}</span>
                        )}
                      </div>
                      <div>
                        <h4
                          className={cn(
                            "mb-1 text-sm font-black uppercase tracking-tight italic",
                            step.done ? "text-green-500 dark:text-green-400" : "text-foreground dark:text-white",
                          )}
                        >
                          {step.title}
                        </h4>
                        <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tighter text-muted-foreground dark:text-white/30">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
            </SpotlightCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SpotlightCard
              className="overflow-hidden rounded-[40px] border border-border bg-card/90 dark:border-white/10 dark:bg-white/5"
              spotlightColor="rgba(124, 77, 255, 0.1)"
            >
            <div className="flex items-center justify-between border-b border-border bg-muted/30 p-8 backdrop-blur-xl dark:border-white/5 dark:bg-white/2">
              <div>
                <h3 className="mb-2 text-xl font-black italic leading-none text-foreground dark:text-white">
                  Upcoming Events
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/30">
                  Your next published events
                </p>
              </div>
              <Link href="/dashboard/events">
                <Button
                  variant="ghost"
                  className="group h-10 gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/20 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="p-4">
              {upcomingLoading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl bg-muted dark:bg-white/5" />
                  ))}
                </div>
              ) : !upcomingEvents?.events?.length ? (
                <div className="space-y-6 p-16 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] border border-border bg-muted text-muted-foreground/40 dark:border-white/10 dark:bg-white/5 dark:text-white/10">
                    <CalendarDays className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black uppercase italic tracking-tighter text-foreground dark:text-white">
                      No Published Events
                    </h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 dark:text-white/20">
                      Create an event to get started
                    </p>
                  </div>
                  <Link href="/dashboard/events/new">
                    <Button className="rounded-2xl border border-border bg-card px-8 font-black uppercase italic tracking-widest text-foreground transition-all hover:bg-primary dark:border-white/10 dark:bg-white/10 dark:text-white">
                      Create Event
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="group flex items-center justify-between rounded-[24px] border border-border bg-card/70 p-6 transition-all hover:bg-muted/60 dark:border-white/5 dark:bg-white/3 dark:hover:bg-white/8"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <CalendarDays className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="mb-1 text-lg font-black italic leading-none tracking-tight text-foreground dark:text-white">
                            {event.title}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-white/20">
                            {format(new Date(event.startsAt), "MMM d, yyyy · HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="hidden text-right sm:block">
                          <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 dark:text-white/10">
                            Status
                          </p>
                          <Badge className="border-none bg-muted px-3 text-[9px] font-black uppercase tracking-widest italic text-muted-foreground dark:bg-white/10 dark:text-white/60">
                            {event.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          className="h-12 w-12 rounded-2xl p-0 text-muted-foreground/70 hover:bg-muted hover:text-foreground dark:text-white/10 dark:hover:bg-white/5 dark:hover:text-white"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            </SpotlightCard>
          </motion.div>
        </div>

        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <SpotlightCard
              className="space-y-6 rounded-[40px] border border-border bg-card/90 p-8 dark:border-white/10 dark:bg-white/5"
              spotlightColor="rgba(124, 77, 255, 0.1)"
            >
            <h3 className="ml-2 text-lg font-black uppercase italic tracking-tighter text-foreground dark:text-white">
              Quick Actions
            </h3>
            <div className="grid gap-4">
              {[
                { label: "New Event", href: "/dashboard/events/new", icon: CalendarDays, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Add Guests", href: "/dashboard/contacts", icon: UserPlus, color: "text-purple-400", bg: "bg-purple-400/10" },
                { label: "Studio", href: "/dashboard/tickets", icon: Ticket, color: "text-green-400", bg: "bg-green-400/10" },
                { label: "Reports", href: "/dashboard/reports", icon: BarChart3, color: "text-coral-400", bg: "bg-primary/10" },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button
                    variant="outline"
                    className="group h-16 w-full justify-between gap-4 rounded-2xl border-border bg-card/70 px-6 transition-all hover:border-primary/50 hover:bg-muted/60 dark:border-white/5 dark:bg-white/3 dark:hover:bg-white/8"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", action.bg)}>
                        <action.icon className={cn("h-5 w-5", action.color)} />
                      </div>
                      <span className="text-sm font-black italic text-foreground dark:text-white/80">
                        {action.label}
                      </span>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground/70 transition-colors group-hover:text-primary dark:text-white/20" />
                  </Button>
                </Link>
              ))}
            </div>
          </SpotlightCard>
        </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SpotlightCard
              className="space-y-8 rounded-[40px] border border-border bg-card/90 p-8 dark:border-white/10 dark:bg-white/5"
              spotlightColor="rgba(124, 77, 255, 0.1)"
            >


            <div className="ml-2 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-foreground dark:text-white">
                Recent Activity
              </h3>
              <Activity className="h-5 w-5 animate-pulse text-primary" />
            </div>

            {totalCheckIns > 0 ? (
              <div className="space-y-6">
                <div className="group flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500 transition-transform group-hover:scale-110">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black italic text-foreground dark:text-white">
                      {totalCheckIns} check-ins recorded
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 dark:text-white/20">
                      Live across your events
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-10 text-center">
                <Clock className="mx-auto h-10 w-10 text-muted-foreground/30 dark:text-white/5" />
                <p className="text-[10px] font-black uppercase leading-relaxed tracking-[0.2em] text-muted-foreground/70 dark:text-white/20">
                  No recent activity yet
                </p>
              </div>
            )}
            </SpotlightCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-[40px] border border-primary/30 bg-linear-to-br from-primary/20 to-transparent p-10"
          >
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase italic leading-none tracking-tighter text-foreground dark:text-white">
                  Plan Usage
                </h3>
                <Badge className="border-none bg-primary px-3 text-[9px] font-black uppercase text-white">
                  BASIC
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40">
                    Check-in Credits
                  </p>
                  <p className="text-xl font-black italic leading-none text-foreground dark:text-white">
                    {totalCheckIns}{" "}
                    <span className="text-[10px] text-muted-foreground/70 dark:text-white/20">
                      / 50
                    </span>
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalCheckIns / 50) * 100, 100)}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>

              <Link href="/dashboard/settings" className="block">
                <Button className="h-14 w-full rounded-2xl border border-border bg-card/80 font-black uppercase italic tracking-widest text-foreground transition-all hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  Manage Plan
                </Button>
              </Link>
            </div>
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

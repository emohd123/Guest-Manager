"use client";

import Link from "next/link";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import {
  CalendarDays,
  Users,
  CheckCircle,
  TrendingUp,
  Download,
  ArrowRight,
  DollarSign
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const { data: eventStats, isLoading: statsLoading } = trpc.events.stats.useQuery();
  const { data: eventsData, isLoading: eventsLoading } = trpc.events.list.useQuery({
    limit: 20,
    offset: 0,
  });
  const { data: orderStats } = trpc.orders.stats.useQuery({});

  const totalEvents = eventStats?.total ?? 0;
  const totalGuests = eventStats?.totalGuests ?? 0;
  const totalCheckIns = eventStats?.totalCheckIns ?? 0;
  const attendanceRate = totalGuests > 0 ? Math.round((totalCheckIns / totalGuests) * 100) : 0;

  const overviewStats = [
    {
      title: "Active Events",
      value: statsLoading ? "—" : totalEvents.toString(),
      icon: CalendarDays,
      sub: "Total registered",
      delay: 0
    },
    {
      title: "Guest List",
      value: statsLoading ? "—" : totalGuests.toString(),
      icon: Users,
      sub: "Across all events",
      delay: 0.1
    },
    {
      title: "Check-ins",
      value: statsLoading ? "—" : totalCheckIns.toString(),
      icon: CheckCircle,
      sub: "Verified arrivals",
      delay: 0.2
    },
    {
      title: "Attendance",
      value: statsLoading ? "—" : `${attendanceRate}%`,
      icon: TrendingUp,
      sub: "Average rate",
      delay: 0.3
    },
  ];

  return (
    <div className="space-y-12 pb-20 px-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase transition-all">Analytics</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Dynamic performance metrics
          </p>
        </motion.div>
        <Button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black text-base transition-all hover:-translate-y-1 flex gap-3 group">
          <Download className="h-6 w-6 group-hover:animate-bounce" />
          Full Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: stat.delay }}
            className="group relative overflow-hidden rounded-[32px] bg-white/5 border border-white/10 p-8 transition-all hover:bg-white/8"
          >
            <div className="relative z-10">
              <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform duration-500">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{stat.title}</p>
              <h2 className="text-3xl font-black text-white italic tracking-tight">{stat.value}</h2>
              <p className="text-[10px] font-bold text-white/10 uppercase tracking-tighter mt-4">{stat.sub}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="events" className="space-y-10">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto">
          <TabsTrigger value="events" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Events</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Growth</TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-0 outline-none">
          <div className="rounded-[40px] bg-white/5 border border-white/10 overflow-hidden backdrop-blur-3xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white italic leading-none mb-2">Performance Index</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Recent Event Results</p>
              </div>
              <Link href="/dashboard/events/new">
                <Button className="rounded-xl bg-primary text-white font-black px-6 text-xs italic tracking-tight uppercase">New Event</Button>
              </Link>
            </div>
            
            {eventsLoading ? (
              <div className="p-20 text-center">
                <div className="h-10 w-10 animate-spin border-4 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/20 border-b border-white/5">
                      <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Reference</th>
                      <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Title</th>
                      <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Status</th>
                      <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Date</th>
                      <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Load</th>
                      <th className="py-6 px-8 text-right font-black uppercase tracking-widest text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {eventsData?.events.map((event) => (
                      <tr key={event.id} className="group hover:bg-white/5 transition-all">
                        <td className="py-6 px-8">
                          <span className="font-mono text-xs font-black text-primary italic">#{event.id.slice(0, 6)}</span>
                        </td>
                        <td className="py-6 px-8">
                          <p className="font-bold text-white text-base leading-none mb-1">{event.title}</p>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{event.eventType}</p>
                        </td>
                        <td className="py-6 px-8">
                          <Badge className={cn(
                            "rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest border-none",
                            event.status === "published" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                          )}>
                            {event.status}
                          </Badge>
                        </td>
                        <td className="py-6 px-8 font-bold text-white/40 italic">
                          {format(new Date(event.startsAt), "MMM d, yyyy")}
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-2">
                             <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: "65%" }}
                                  className="h-full bg-primary"
                                />
                             </div>
                             <span className="text-[10px] font-black text-white italic">65%</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <Link href={`/dashboard/events/${event.id}`}>
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-white/30 hover:text-white">
                              <ArrowRight className="h-5 w-5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0 outline-none">
          <div className="grid gap-10 lg:grid-cols-2">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="rounded-[40px] bg-white/5 border border-white/10 p-10 flex flex-col justify-between overflow-hidden relative"
            >
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white italic mb-2">Arrival Velocity</h3>
                <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] mb-10">Global checked-in metrics</p>
                
                <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-xs font-black text-white/60 uppercase tracking-tighter">Verified arrivals</span>
                        <span className="text-3xl font-black text-white italic">{attendanceRate}%</span>
                      </div>
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${attendanceRate}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(255,107,107,0.5)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div className="p-6 rounded-[24px] bg-white/3 border border-white/5">
                         <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Checked In</p>
                         <p className="text-xl font-black text-white italic">{totalCheckIns}</p>
                      </div>
                      <div className="p-6 rounded-[24px] bg-white/3 border border-white/5">
                         <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Remaining</p>
                         <p className="text-xl font-black text-white italic">{totalGuests - totalCheckIns}</p>
                      </div>
                    </div>
                </div>
              </div>
              <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/5 rounded-full blur-[100px]" />
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="rounded-[40px] bg-[#1A1C30] border border-white/10 p-10 flex flex-col relative overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white italic mb-2">Status Distribution</h3>
                <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] mb-10">Event cycle breakdown</p>
                
                <div className="space-y-4">
                   {["Published", "Draft", "Completed", "Cancelled"].map((status, i) => (
                     <div key={status} className="flex items-center justify-between p-5 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors cursor-default">
                        <div className="flex items-center gap-4">
                           <div className={cn("h-3 w-3 rounded-full shadow-lg", i === 0 ? "bg-green-400" : i === 1 ? "bg-amber-400" : "bg-white/20")} />
                           <span className="font-black text-white/80 italic text-sm">{status}</span>
                        </div>
                        <span className="font-black text-white italic">0{4-i}</span>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-0 outline-none">
          <div className="grid gap-10 lg:grid-cols-2">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-[40px] bg-linear-to-br from-primary/20 to-transparent border border-primary/30 p-12 relative overflow-hidden h-fit"
            >
              <div className="relative z-10 text-center py-6">
                <div className="mx-auto h-16 w-16 rounded-3xl bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center mb-8">
                   <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px] mb-4 text-center">Gross Capital</h3>
                <h2 className="text-6xl font-black text-white italic tracking-tighter mb-10 text-center">
                  ${((orderStats?.revenue ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
                
                <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/10">
                   <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Orders</p>
                      <p className="text-lg font-black text-white italic">{orderStats?.totalOrders ?? 0}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Tickets</p>
                      <p className="text-lg font-black text-white italic">{orderStats?.ticketsSold ?? 0}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Average</p>
                      <p className="text-lg font-black text-white italic">
                        ${orderStats?.totalOrders ? ((orderStats.revenue / orderStats.totalOrders) / 100).toFixed(2) : "0.00"}
                      </p>
                   </div>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/10 rounded-full blur-[100px]" />
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="rounded-[40px] bg-white/5 border border-white/10 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="h-20 w-20 rounded-full bg-[#635BFF]/10 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-white/5">
                   <span className="text-4xl font-black text-[#635BFF] italic">S</span>
                </div>
                <h3 className="text-2xl font-black text-white italic mb-4">Payout Infrastructure</h3>
                <p className="text-white/30 text-sm max-w-[300px] mb-10 leading-relaxed">
                  Bridge your account with Stripe to unlock global payment processing and automated settlement.
                </p>
                <Link href="/dashboard/settings" className="w-full">
                  <Button className="h-16 w-full rounded-3xl bg-[#635BFF] hover:bg-[#635BFF]/90 text-white font-black text-base shadow-2xl shadow-[#635BFF]/20 transition-all hover:scale-[1.02] active:scale-95 italic">
                    Configure Gateway
                  </Button>
                </Link>
                <p className="mt-6 text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">Status: Disconnected</p>
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

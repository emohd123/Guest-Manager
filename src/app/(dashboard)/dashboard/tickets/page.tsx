"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { motion } from "framer-motion";
import {
  Ticket,
  Plus,
  Palette,
  ScanLine,
  QrCode,
  FileText,
  Smartphone,
  DollarSign,
  Hash,
  ExternalLink,
  ChevronRight,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsPage() {
  const { data, isLoading } = trpc.ticketTypes.listAll.useQuery();
  const { data: orderStats } = trpc.orders.stats.useQuery({});

  const ticketTypeList = data?.ticketTypes ?? [];
  const totalTypes = data?.total ?? 0;
  const totalSold = orderStats?.ticketsSold ?? 0;

  const quickStats = [
    { label: "Protocol Types", value: isLoading ? "—" : totalTypes.toString(), icon: Ticket, sub: "Defined tiers", delay: 0 },
    { label: "Blueprints", value: "4", icon: Palette, sub: "Dynamic templates", delay: 0.1 },
    { label: "Issued Items", value: isLoading ? "—" : totalSold.toString(), icon: Hash, sub: "Verification success", delay: 0.2 },
    { label: "Live Scans", value: "0", icon: ScanLine, sub: "Entry velocity", delay: 0.3 },
  ];

  const templatePreviews = [
    {
      name: "NEON MINIMAL",
      description: "Sleek glassmorphism with high contrast",
      style: "bg-linear-to-br from-slate-950 to-slate-900 border-white/5",
    },
    {
      name: "CORAL STRIKE",
      description: "Primary brand identity with glow",
      style: "bg-linear-to-br from-primary to-primary/80 border-primary/20 shadow-2xl shadow-primary/20",
    },
    {
      name: "LUXE GOLD",
      description: "Premium VIP aesthetic with border",
      style: "bg-linear-to-br from-amber-400/20 to-transparent border-amber-400/30",
    },
    {
      name: "CYBER DARK",
      description: "Low-light optimized entry key",
      style: "bg-linear-to-br from-black to-slate-900 border-white/10",
    },
  ];

  return (
    <div className="space-y-12 pb-20 px-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-foreground dark:text-white italic tracking-tighter uppercase">Studio</h1>
          <p className="text-muted-foreground dark:text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Asset Engineering & Distribution
          </p>
        </motion.div>
        <Link href="/dashboard/events">
          <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
            <Plus className="h-6 w-6" />
            Create Spec
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: stat.delay }}
            className="group relative overflow-hidden rounded-[32px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-8 transition-all hover:bg-muted/60 dark:hover:bg-white/8"
          >
            <div className="relative z-10">
              <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform duration-500">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/30 mb-1">{stat.label}</p>
              <h2 className="text-3xl font-black text-foreground dark:text-white italic tracking-tight">{stat.value}</h2>
              <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/10 uppercase tracking-tighter mt-4">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="tickets" className="space-y-10">
        <TabsList className="bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-1 rounded-2xl h-auto w-fit">
          <TabsTrigger value="tickets" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Catalog</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Blueprints</TabsTrigger>
          <TabsTrigger value="scanner" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Interface</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-0 outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 overflow-hidden"
          >
            <div className="p-8 border-b border-border dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-foreground dark:text-white italic leading-none mb-2">Protocol Catalog</h3>
                <p className="text-muted-foreground dark:text-white/30 text-[10px] font-bold uppercase tracking-widest">Active admission structures</p>
              </div>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-3xl bg-muted dark:bg-white/5" />)}
                </div>
              ) : ticketTypeList.length === 0 ? (
                <div className="p-20 text-center space-y-6">
                  <div className="h-20 w-20 rounded-[32px] bg-muted dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center mx-auto text-muted-foreground/40 dark:text-white/10">
                    <Ticket className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-foreground dark:text-white italic uppercase tracking-tighter">No Active Protocols</h4>
                    <p className="text-muted-foreground/70 dark:text-white/20 text-[10px] font-bold uppercase tracking-widest">Initialize event tiers to begin</p>
                  </div>
                  <Link href="/dashboard/events">
                    <Button className="rounded-2xl bg-card dark:bg-white/10 hover:bg-primary text-foreground dark:text-white border border-border dark:border-white/10 font-black italic uppercase tracking-widest px-8 transition-all">
                      Configure Events
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {ticketTypeList.map((tt, i) => (
                    <motion.div 
                      key={tt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-[32px] bg-card/70 dark:bg-white/3 border border-border dark:border-white/5 hover:bg-muted/60 dark:hover:bg-white/8 transition-all gap-6"
                    >
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Ticket className="h-7 w-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-black text-foreground dark:text-white text-lg italic tracking-tighter leading-none">{tt.name}</p>
                            <Badge className="bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/40 border-none font-black text-[9px] uppercase tracking-widest px-3 italic">
                              {tt.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            {tt.eventTitle && (
                              <span className="text-[10px] font-black text-muted-foreground/70 dark:text-white/20 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="h-3 w-3 text-primary" />
                                {tt.eventTitle}
                              </span>
                            )}
                            <span className="text-[10px] font-black text-muted-foreground/70 dark:text-white/20 uppercase tracking-widest flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              {(tt.price ?? 0) === 0 ? "GRATIS" : `$${((tt.price ?? 0) / 100).toFixed(2)}`}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground/70 dark:text-white/20 uppercase tracking-widest flex items-center gap-2">
                              <Hash className="h-3 w-3" />
                              {tt.quantitySold ?? 0} / {tt.quantityTotal ?? "INF"} ISSUED
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/dashboard/events/${tt.eventId}`}>
                        <Button variant="ghost" className="h-12 w-12 rounded-2xl p-0 text-muted-foreground/70 dark:text-white/10 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5">
                          <ExternalLink className="h-6 w-6" />
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="templates" className="mt-0 outline-none">
          <div className="space-y-10">
            <div className="flex items-center justify-between px-4">
              <div>
                <h3 className="text-2xl font-black text-foreground dark:text-white italic leading-none mb-2">Visual Blueprints</h3>
                <p className="text-muted-foreground dark:text-white/30 text-[10px] font-bold uppercase tracking-widest">Global identity style guides</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {templatePreviews.map((template, i) => (
                <motion.div
                  key={template.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 overflow-hidden hover:bg-muted/60 dark:hover:bg-white/8 transition-all flex flex-col"
                >
                  <div className={cn("m-4 h-48 rounded-[32px] p-6 flex flex-col justify-between border relative overflow-hidden", template.style)}>
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-50 italic">DEPLOYMENT ALPHA</span>
                      <Zap className="h-4 w-4 opacity-30" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-sm font-black italic tracking-tighter uppercase line-clamp-1">VERIFIED GUEST</p>
                      <p className="text-[8px] font-black opacity-50 uppercase tracking-widest">MARCH 2026</p>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                      <span className="text-[8px] font-mono opacity-40 uppercase tracking-widest">#8A-0001FF</span>
                      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                        <QrCode className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-white/5 rounded-full blur-3xl" />
                  </div>
                  <div className="p-8 space-y-4">
                    <h4 className="text-lg font-black text-foreground dark:text-white italic tracking-tighter uppercase">{template.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground dark:text-white/30 uppercase tracking-widest leading-relaxed">
                      {template.description}
                    </p>
                    <Button variant="outline" className="h-12 w-full rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/10 font-black italic uppercase tracking-widest text-[10px] transition-all">
                      Deploy Protocol
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Asset Capabilities */}
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: "Vector Matrix", desc: "High-resolution PDF generation with dynamic layering.", icon: FileText, color: "text-red-400" },
                { title: "Mobile Integration", desc: "Native wallet synchronization for iOS and ecosystem.", icon: Smartphone, color: "text-primary" },
                { title: "Dual Scanning", desc: "Support for QR, DataMatrix, and high-density barcodes.", icon: QrCode, color: "text-green-400" },
              ].map((cap, i) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="p-8 rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 group hover:bg-muted/60 dark:hover:bg-white/8 transition-all"
                >
                  <div className="h-12 w-12 rounded-2xl bg-muted dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <cap.icon className={cn("h-6 w-6", cap.color)} />
                  </div>
                  <h4 className="text-xl font-black text-foreground dark:text-white italic tracking-tighter uppercase mb-4">{cap.title}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground dark:text-white/30 uppercase tracking-widest leading-relaxed">
                    {cap.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scanner" className="mt-0 outline-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-16 text-center space-y-10 relative overflow-hidden"
          >
            <div className="relative z-10 space-y-6">
              <div className="h-24 w-24 rounded-[40px] bg-primary/10 flex items-center justify-center mx-auto text-primary shadow-2xl shadow-primary/20 rotate-12">
                <ScanLine className="h-12 w-12" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-foreground dark:text-white italic tracking-tighter uppercase leading-none">Scanning Interface</h3>
                <p className="max-w-md mx-auto text-[10px] font-bold text-muted-foreground dark:text-white/30 uppercase tracking-[0.2em] leading-relaxed">
                  Connect high-velocity capture devices or initialize local camera protocols for real-time validation.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/dashboard/events">
                  <Button className="h-16 px-10 rounded-2xl bg-primary text-white font-black italic uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 flex gap-3">
                    <ScanLine className="h-6 w-6" />
                    Initialize Kiosk
                  </Button>
                </Link>
                <Button variant="outline" className="h-16 px-10 rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/10 font-black italic uppercase tracking-widest transition-all">
                  Configure Peripheral
                </Button>
              </div>
              <p className="text-[9px] font-black text-muted-foreground/70 dark:text-white/10 uppercase tracking-[0.4em] pt-4">Requires Camera Authorization (v2.0.4)</p>
            </div>
            <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/5 rounded-full blur-[100px]" />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

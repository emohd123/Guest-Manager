"use client";
import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Mail, RefreshCw, Star, Filter, X, LayoutTemplate, Activity, Zap, Target, Search, ArrowRight, ShieldCheck } from "lucide-react";
import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function SentEmailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data, isLoading } = trpc.sentEmails.list.useQuery({
    eventId,
    limit: 100,
  });

  const [viewingEmail, setViewingEmail] = React.useState<any | null>(null);
  const [activityEmail, setActivityEmail] = React.useState<any | null>(null);
  const [resendingEmail, setResendingEmail] = React.useState<any | null>(null);
  
  const utils = trpc.useUtils();
  const resendMutation = trpc.sentEmails.resend.useMutation({
    onSuccess: () => {
      utils.sentEmails.list.invalidate();
      setResendingEmail(null);
    },
    onError: (err) => {
      alert("FAILURE: " + err.message);
    }
  });

  const syncMutation = trpc.sentEmails.syncStatus.useMutation({
    onSuccess: (result) => {
      utils.sentEmails.list.invalidate();
    },
    onError: (err) => {
      alert("SYNC FAILURE: " + err.message);
    },
  });

  const emails = data?.emails ?? [];

  const columns = [
    {
      accessorKey: "state",
      header: "Operation State",
      cell: ({ row }: { row: any }) => (
        <Badge className="bg-green-500/10 text-green-500 border-none rounded-full px-3 py-0.5 font-black text-[8px] uppercase tracking-widest italic">{row.original.state}</Badge>
      )
    },
    {
      accessorKey: "status",
      header: "Registry Status",
      cell: ({ row }: { row: any }) => (
        <span className="text-[10px] font-bold uppercase tracking-widest leading-none italic text-muted-foreground">{row.original.status}</span>
      )
    },
    {
      accessorKey: "emailAddress",
      header: "Target Node",
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col gap-0.5">
           <span className="text-[11px] font-black text-foreground dark:text-white italic truncate uppercase tracking-tight leading-none">{row.original.emailAddress}</span>
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">ID: {row.original.id?.split('-')[0] || 'N/A'}</span>
        </div>
      )
    },
    {
      accessorKey: "openCount",
      header: "Interceptions",
      cell: ({ row }: { row: any }) => <div className="font-black italic text-primary">{row.original.openCount}</div>
    },
    {
      accessorKey: "clickCount",
      header: "Propagations",
      cell: ({ row }: { row: any }) => <div className="font-black italic text-muted-foreground">{row.original.clickCount}</div>
    },
    {
      id: "actions",
      header: "CMD",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center justify-end gap-2">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border bg-card/70 text-muted-foreground transition-all hover:text-foreground dark:border-white/5 dark:bg-white/5" onClick={() => setViewingEmail(row.original)}><Target className="h-4 w-4" /></Button>
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border bg-card/70 text-muted-foreground transition-all hover:text-foreground dark:border-white/5 dark:bg-white/5" onClick={() => setActivityEmail(row.original)}><Activity className="h-4 w-4" /></Button>
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border bg-card/70 text-muted-foreground transition-all hover:text-foreground dark:border-white/5 dark:bg-white/5" onClick={() => setResendingEmail(row.original)}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-12 pb-20 px-2">
       {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black text-foreground italic tracking-tighter uppercase leading-none">Relay</h1>
          <p className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase italic tracking-[0.2em] text-muted-foreground">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Communication Transmission Logs
          </p>
        </motion.div>
        
        <div className="flex flex-wrap gap-3">
           <Button
            variant="ghost"
            size="icon"
            className="group h-14 w-14 rounded-2xl border border-border bg-card/80 text-muted-foreground transition-all hover:text-foreground dark:border-white/10 dark:bg-white/5"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate({ eventId })}
          >
            <RefreshCw className={cn("h-6 w-6", syncMutation.isPending && "animate-spin")} />
          </Button>
          <Button className="flex h-14 gap-3 rounded-2xl bg-primary px-8 text-base font-black italic text-white shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95">
            <Plus className="h-6 w-6" />
            Compose Broadcast
          </Button>
        </div>
      </div>

       <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-8">
          <div className="flex gap-4 items-center">
             <div className="relative group flex-1 max-w-md">
                <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Filter target node address..." className="h-12 rounded-2xl border-border bg-card/80 pl-14 text-[10px] font-black italic uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:ring-primary transition-all" />
             </div>
             <Button variant="outline" className="h-12 rounded-2xl border-border bg-card/80 px-6 text-[10px] font-black italic uppercase tracking-widest text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/5"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          </div>

          <DataTable
            columns={columns}
            data={emails}
            isLoading={isLoading}
          />
       </motion.div>

       {/* Summaries & Activity Dialogs */}
       <Dialog open={!!viewingEmail} onOpenChange={(o) => !o && setViewingEmail(null)}>
        <DialogContent className="max-w-xl rounded-[40px] border border-border bg-popover p-12 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-slate-950">
          <DialogHeader className="mb-10">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Transmission Detail</p>
            <DialogTitle className="text-3xl font-black text-foreground italic uppercase tracking-tighter dark:text-white">Signal Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
             {[
                { label: "Target Node", value: viewingEmail?.emailAddress },
                { label: "Protocol Type", value: viewingEmail?.subject },
                { label: "Operation State", value: `${viewingEmail?.status} (${viewingEmail?.state})` },
                { label: "Transmission Time", value: viewingEmail?.createdAt ? format(new Date(viewingEmail.createdAt), "PP pp").toUpperCase() : "PENDING" }
             ].map((item, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-[24px] border border-border bg-muted/40 p-6 dark:border-white/5 dark:bg-white/3">
                   <span className="text-[8px] font-black uppercase italic leading-none tracking-[0.4em] text-muted-foreground dark:text-white/20">{item.label}</span>
                   <span className="text-xs font-black uppercase italic leading-none tracking-widest text-foreground dark:text-white">{item.value}</span>
                </div>
             ))}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!activityEmail} onOpenChange={(o) => !o && setActivityEmail(null)}>
        <DialogContent className="max-w-xl rounded-[40px] border border-border bg-popover p-12 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-slate-950">
          <DialogHeader className="mb-10">
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Propagation Timeline</p>
            <DialogTitle className="text-3xl font-black text-foreground italic uppercase tracking-tighter dark:text-white">Signal Activity</DialogTitle>
          </DialogHeader>
          <div className="relative ml-6 space-y-10 border-l-2 border-border pl-10 dark:border-white/10">
             {[
                { title: "Signal Created", time: activityEmail?.createdAt, icon: Zap, color: "text-white/40", bgColor: "bg-white/10" },
                { title: activityEmail?.state === 'Delivered' ? 'Signal Delivered' : 'Propagating...', time: activityEmail?.updatedAt, icon: ShieldCheck, color: "text-green-500", bgColor: "bg-green-500/10" },
                activityEmail?.openCount > 0 && { title: "Signal Intercepted", time: `${activityEmail.openCount} Verified Accesses`, icon: Target, color: "text-primary", bgColor: "bg-primary/10" },
                activityEmail?.clickCount > 0 && { title: "Protocol Propagation", time: `${activityEmail.clickCount} Recursive Clicks`, icon: Activity, color: "text-orange-500", bgColor: "bg-orange-500/10" }
             ].filter(Boolean).map((item: any, i) => (
                <div key={i} className="relative">
                   <div className={cn("absolute -left-[58px] flex h-10 w-10 items-center justify-center rounded-2xl border border-border transition-transform hover:scale-110 dark:border-white/10", item.bgColor, item.color)}>
                      <item.icon className="h-5 w-5" />
                   </div>
                   <h4 className="mb-2 text-sm font-black uppercase italic leading-none tracking-tighter text-foreground dark:text-white">{item.title}</h4>
                   <p className="text-[9px] font-bold uppercase leading-none tracking-widest text-muted-foreground dark:text-white/20">
                     {item.time?.includes(':') ? format(new Date(item.time), "PP pp").toUpperCase() : item.time}
                   </p>
                </div>
             ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resendingEmail} onOpenChange={(o) => !o && setResendingEmail(null)}>
        <DialogContent className="max-w-xl rounded-[40px] border border-border bg-popover p-12 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-slate-950">
          <DialogHeader className="mb-10">
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Recursive Action</p>
             <DialogTitle className="text-3xl font-black text-foreground italic uppercase tracking-tighter dark:text-white">Confirm Relay</DialogTitle>
            <DialogDescription className="mt-4 text-[10px] font-bold uppercase leading-relaxed tracking-widest text-muted-foreground dark:text-white/20">
               Authorize recursive transmission of &quot;{resendingEmail?.type}&quot; to target node {resendingEmail?.emailAddress}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button variant="outline" className="mt-0 h-14 rounded-2xl border-border bg-card/80 px-8 text-xs font-black italic uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground dark:border-white/10 dark:bg-white/5" onClick={() => setResendingEmail(null)}>ABORT</Button>
            <Button 
               className="h-14 px-10 rounded-2xl font-black bg-primary text-white shadow-2xl shadow-primary/20 italic text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-20"
              disabled={resendMutation.isPending}
              onClick={() => {
                if (resendingEmail) {
                  resendMutation.mutate({ emailAddress: resendingEmail.emailAddress, eventId });
                }
              }}
            >
              {resendMutation.isPending ? "RE-TRANSMITTING..." : "EXECUTE RELAY"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

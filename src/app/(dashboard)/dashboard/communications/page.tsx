"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Ticket,
  UserPlus,
  Bell,
  Megaphone,
  ChevronRight,
  Zap,
  Activity,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const campaignTemplates = [
  { id: "ticket-delivery", name: "TICKET RELAY", description: "Batch dispatch of guest admission assets", icon: Ticket, color: "text-blue-400", bg: "bg-blue-400/10" },
  { id: "confirmation", name: "REGISTRY VOID", description: "Validate reception and sync details", icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10" },
  { id: "reminder", name: "H-HOUR ALERT", description: "High-priority pre-operation reminder", icon: Bell, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { id: "invitation", name: "TARGET ACQUISITION", description: "Recruit contacts into the mission grid", icon: UserPlus, color: "text-purple-400", bg: "bg-purple-400/10" },
  { id: "announcement", name: "GLOBAL BROADCAST", description: "Force updates across all operational channels", icon: Megaphone, color: "text-orange-400", bg: "bg-orange-400/10" },
  { id: "custom", name: "RAW PAYLOAD", description: "Encrypted custom transmission from scratch", icon: Mail, color: "text-primary", bg: "bg-primary/10" },
];

export default function CommunicationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    eventId: "",
    recipients: "all",
    body: "",
  });

  const { data: eventsData } = trpc.events.list.useQuery({ limit: 100, offset: 0 });
  const events = eventsData?.events ?? [];

  function handleClose(open: boolean) {
    setCreateOpen(open);
    if (!open) {
      setSelectedTemplate(null);
      setCampaignForm({ name: "", subject: "", eventId: "", recipients: "all", body: "" });
    }
  }

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Relay</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Strategic Transmission Center
          </p>
        </motion.div>
        <Dialog open={createOpen} onOpenChange={handleClose}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
              <Plus className="h-6 w-6" />
              New Deployment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-slate-950 border-white/10 rounded-[40px] shadow-2xl p-0 overflow-hidden">
            <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">Initialize Payload</DialogTitle>
                <DialogDescription className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  {selectedTemplate ? "Configure transmission parameters for selective dispatch." : "Choose a blueprint for your outgoing communication relay."}
                </DialogDescription>
              </DialogHeader>
              
              {!selectedTemplate ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {campaignTemplates.map((t) => (
                    <button 
                      key={t.id} 
                      className="group flex flex-col items-start gap-6 rounded-[32px] bg-white/5 border border-white/10 p-8 text-left transition-all hover:bg-white/8 hover:border-primary/50" 
                      onClick={() => setSelectedTemplate(t.id)}
                    >
                      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:rotate-12", t.bg)}>
                         <t.icon className={cn("h-7 w-7", t.color)} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black italic text-white uppercase tracking-tight text-lg">{t.name}</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Deployment Identifier</Label>
                      <Input className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary" placeholder="e.g., GALA_DISPATCH_v1" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Subject Frequency</Label>
                      <Input className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary" placeholder="Your Operational Assets Inside" />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Target Operation</Label>
                          <Select><SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:ring-primary"><SelectValue placeholder="Select Event" /></SelectTrigger><SelectContent className="bg-slate-950 border-white/10 rounded-2xl">
                            {events.map((e) => (
                              <SelectItem key={e.id} value={e.id} className="font-black italic uppercase text-[10px] py-3">{e.title}</SelectItem>
                            ))}
                          </SelectContent></Select>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Dispatch Audience</Label>
                          <Select><SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus:ring-primary"><SelectValue placeholder="Select Sector" /></SelectTrigger><SelectContent className="bg-slate-950 border-white/10 rounded-2xl">
                             <SelectItem value="all" className="font-black italic uppercase text-[10px] py-3 tracking-widest focus:bg-primary">GLOBAL SECTOR</SelectItem>
                             <SelectItem value="confirmed" className="font-black italic uppercase text-[10px] py-3 tracking-widest focus:bg-primary">VERIFIED UNITS</SelectItem>
                          </SelectContent></Select>
                       </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Payload Content</Label>
                      <Textarea className="rounded-3xl bg-white/5 border-white/10 text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary min-h-[150px] p-6" placeholder="Initialize data string..." />
                    </div>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <Button variant="ghost" className="h-14 px-8 rounded-2xl text-white/20 hover:text-white font-black italic uppercase tracking-widest text-[10px]" onClick={() => setSelectedTemplate(null)}>REVERT</Button>
                    <div className="flex gap-4">
                      <Button variant="outline" className="h-14 px-8 rounded-2xl bg-white/5 border-white/10 text-white font-black italic uppercase tracking-widest text-[10px] flex gap-3 hover:bg-white/10"><Clock className="h-4 w-4" /> AUTO-DELAY</Button>
                      <Button className="h-14 px-10 rounded-2xl bg-primary text-white font-black italic uppercase tracking-widest text-[10px] flex gap-3 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95" onClick={() => { toast.success("Transmission Queued"); handleClose(false); }}><Send className="h-4 w-4" /> DISPATCH</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Dispatched", value: "0", icon: Send, sub: "Outgoing packets", delay: 0 },
          { label: "Successful Relay", value: "0", icon: CheckCircle, sub: "Endpoint reception", delay: 0.1 },
          { label: "Engagement Rate", value: "0%", icon: Mail, sub: "Payload verification", delay: 0.2 },
          { label: "Alert Flags", value: "0", icon: AlertCircle, sub: "Relay failures", delay: 0.3 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: stat.delay }}
            className="group relative overflow-hidden rounded-[32px] bg-white/5 border border-white/10 p-8 transition-all hover:bg-white/8"
          >
            <div className="relative z-10 space-y-4">
               <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                  <stat.icon className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{stat.label}</p>
                 <h2 className="text-3xl font-black text-white italic tracking-tight uppercase leading-none">{stat.value}</h2>
                 <p className="text-[10px] font-bold text-white/10 uppercase tracking-tighter mt-4 italic">{stat.sub}</p>
               </div>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-3xl" />
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-10 focus:outline-none">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto w-fit">
          <TabsTrigger value="campaigns" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Feed</TabsTrigger>
          <TabsTrigger value="automations" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Automaton</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Blueprints</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-0 outline-none">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[40px] bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/2 flex items-center justify-between">
               <div>
                  <h3 className="text-xl font-black text-white italic leading-none mb-2">Relay Stream</h3>
                  <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Active and archived transmissions</p>
               </div>
            </div>
            <div className="p-24 text-center space-y-8">
              <div className="h-20 w-20 rounded-[32px] bg-white/3 border border-white/10 flex items-center justify-center mx-auto text-white/10">
                <Mail className="h-10 w-10 capitalize" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Transmission Silence</h4>
                <p className="max-w-xs mx-auto text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                  Awaiting operational input. No relay events detected in current frequency.
                </p>
              </div>
              <Button className="h-14 px-10 rounded-2xl bg-white/10 hover:bg-primary text-white font-black italic uppercase tracking-widest transition-all" onClick={() => setCreateOpen(true)}>
                Initialize Payload
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="automations" className="mt-0 outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { name: "RECEPTION VALIDATE", trigger: "UNIT REGISTRY SYNC", status: "OFFLINE", icon: Zap },
              { name: "ASSET DISPATCH", trigger: "ORDER CONFIRMATION", status: "OFFLINE", icon: Ticket },
              { name: "PRE-OP REMINDER", trigger: "H-24 COUNTDOWN", status: "OFFLINE", icon: Bell },
              { name: "POST-OP INTEL", trigger: "DEPLOYMENT TERMINATE", status: "OFFLINE", icon: CheckCircle },
            ].map((a, i) => (
              <motion.div key={a.name} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="p-10 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/8 transition-all">
                <div className="flex items-center gap-8">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:scale-110 transition-all border border-white/5">
                     <a.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">{a.name}</h4>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Trigger: {a.trigger}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <Badge className="bg-white/10 text-white/40 border-none px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest italic">{a.status}</Badge>
                   <Button variant="ghost" className="h-10 w-10 p-0 text-white/10 hover:text-white hover:bg-white/5 rounded-xl"><ArrowRight className="h-5 w-5" /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-0 outline-none">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaignTemplates.map((t, i) => (
              <motion.div key={t.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }} className="group rounded-[40px] bg-white/5 border border-white/10 p-10 flex flex-col justify-between hover:bg-white/8 transition-all relative overflow-hidden min-h-[300px]">
                <div className="relative z-10">
                   <div className={cn("p-4 w-fit rounded-2xl mb-8 transition-transform group-hover:rotate-12", t.bg, t.color)}>
                     <t.icon className="h-8 w-8" />
                   </div>
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">{t.name}</h3>
                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] leading-relaxed">{t.description}</p>
                </div>
                <Button className="relative z-10 mt-10 h-14 w-full rounded-2xl bg-white/5 border border-white/10 text-white group-hover:bg-primary transition-all font-black italic uppercase tracking-widest text-xs">
                   Load Blueprint
                </Button>
                <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

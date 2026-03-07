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
  { id: "ticket-delivery", name: "Ticket Delivery", description: "Send purchased tickets to attendees", icon: Ticket, color: "text-blue-400", bg: "bg-blue-400/10" },
  { id: "confirmation", name: "Registration Confirmation", description: "Confirm registration details and next steps", icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10" },
  { id: "reminder", name: "Event Reminder", description: "Remind attendees before the event starts", icon: Bell, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { id: "invitation", name: "Invitation", description: "Invite contacts to register for an event", icon: UserPlus, color: "text-purple-400", bg: "bg-purple-400/10" },
  { id: "announcement", name: "Announcement", description: "Share updates with your audience", icon: Megaphone, color: "text-orange-400", bg: "bg-orange-400/10" },
  { id: "custom", name: "Custom Email", description: "Write a message from scratch", icon: Mail, color: "text-primary", bg: "bg-primary/10" },
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
          <h1 className="text-4xl font-black text-foreground dark:text-white italic tracking-tighter uppercase leading-none">Communications</h1>
          <p className="text-muted-foreground dark:text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Email campaigns, reminders, and announcements
          </p>
        </motion.div>
        <Dialog open={createOpen} onOpenChange={handleClose}>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
              <Plus className="h-6 w-6" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-popover dark:bg-slate-950 border-border dark:border-white/10 text-popover-foreground rounded-[40px] shadow-2xl p-0 overflow-hidden">
            <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-foreground dark:text-white italic tracking-tighter uppercase leading-none mb-2">Create Campaign</DialogTitle>
                <DialogDescription className="text-muted-foreground dark:text-white/20 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  {selectedTemplate ? "Choose recipients, message details, and timing." : "Choose a template for your next outgoing message."}
                </DialogDescription>
              </DialogHeader>
              
              {!selectedTemplate ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {campaignTemplates.map((t) => (
                    <button 
                      key={t.id} 
                      className="group flex flex-col items-start gap-6 rounded-[32px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-8 text-left transition-all hover:bg-muted/60 dark:hover:bg-white/8 hover:border-primary/50" 
                      onClick={() => setSelectedTemplate(t.id)}
                    >
                      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:rotate-12", t.bg)}>
                         <t.icon className={cn("h-7 w-7", t.color)} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black italic text-foreground dark:text-white uppercase tracking-tight text-lg">{t.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground dark:text-white/20 uppercase tracking-widest leading-relaxed">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-widest ml-1">Campaign Name</Label>
                      <Input className="h-14 rounded-2xl bg-card border-border text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary" placeholder="Spring Gala Reminder" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-widest ml-1">Email Subject</Label>
                      <Input className="h-14 rounded-2xl bg-card border-border text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary" placeholder="Your tickets and event details" />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-widest ml-1">Event</Label>
                          <Select><SelectTrigger className="h-14 rounded-2xl bg-card border-border text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-primary"><SelectValue placeholder="Select Event" /></SelectTrigger><SelectContent className="bg-popover dark:bg-slate-950 border-border dark:border-white/10 text-popover-foreground rounded-2xl">
                            {events.map((e) => (
                              <SelectItem key={e.id} value={e.id} className="font-black italic uppercase text-[10px] py-3">{e.title}</SelectItem>
                            ))}
                          </SelectContent></Select>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-widest ml-1">Audience</Label>
                          <Select><SelectTrigger className="h-14 rounded-2xl bg-card border-border text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-primary"><SelectValue placeholder="Select Sector" /></SelectTrigger><SelectContent className="bg-popover dark:bg-slate-950 border-border dark:border-white/10 text-popover-foreground rounded-2xl">
                             <SelectItem value="all" className="font-black italic uppercase text-[10px] py-3 tracking-widest focus:bg-primary">All Attendees</SelectItem>
                             <SelectItem value="confirmed" className="font-black italic uppercase text-[10px] py-3 tracking-widest focus:bg-primary">Confirmed Attendees</SelectItem>
                          </SelectContent></Select>
                       </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-widest ml-1">Message</Label>
                      <Textarea className="rounded-3xl bg-card border-border text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary min-h-[150px] p-6" placeholder="Write your message..." />
                    </div>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-border dark:border-white/5">
                    <Button variant="ghost" className="h-14 px-8 rounded-2xl text-muted-foreground dark:text-white/20 hover:text-foreground dark:hover:text-white font-black italic uppercase tracking-widest text-[10px]" onClick={() => setSelectedTemplate(null)}>Back</Button>
                    <div className="flex gap-4">
                      <Button variant="outline" className="h-14 px-8 rounded-2xl bg-card border-border text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white font-black italic uppercase tracking-widest text-[10px] flex gap-3 hover:bg-muted dark:hover:bg-white/10"><Clock className="h-4 w-4" /> Schedule</Button>
                      <Button className="h-14 px-10 rounded-2xl bg-primary text-white font-black italic uppercase tracking-widest text-[10px] flex gap-3 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95" onClick={() => { toast.success("Campaign queued"); handleClose(false); }}><Send className="h-4 w-4" /> Send</Button>
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
          { label: "Messages Sent", value: "0", icon: Send, sub: "Outgoing emails", delay: 0 },
          { label: "Delivered", value: "0", icon: CheckCircle, sub: "Successful deliveries", delay: 0.1 },
          { label: "Open Rate", value: "0%", icon: Mail, sub: "Recipient engagement", delay: 0.2 },
          { label: "Issues", value: "0", icon: AlertCircle, sub: "Delivery problems", delay: 0.3 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: stat.delay }}
            className="group relative overflow-hidden rounded-[32px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-8 transition-all hover:bg-muted/60 dark:hover:bg-white/8"
          >
            <div className="relative z-10 space-y-4">
               <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                  <stat.icon className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/30 mb-1">{stat.label}</p>
                 <h2 className="text-3xl font-black text-foreground dark:text-white italic tracking-tight uppercase leading-none">{stat.value}</h2>
                 <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/10 uppercase tracking-tighter mt-4 italic">{stat.sub}</p>
               </div>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-3xl" />
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-10 focus:outline-none">
        <TabsList className="bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-1 rounded-2xl h-auto w-fit">
          <TabsTrigger value="campaigns" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Campaigns</TabsTrigger>
          <TabsTrigger value="automations" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Automations</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all italic">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-0 outline-none">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 overflow-hidden">
            <div className="p-8 border-b border-border dark:border-white/5 bg-muted/30 dark:bg-white/2 flex items-center justify-between">
               <div>
                  <h3 className="text-xl font-black text-foreground dark:text-white italic leading-none mb-2">Campaign History</h3>
                  <p className="text-muted-foreground dark:text-white/30 text-[10px] font-bold uppercase tracking-widest">Recent and scheduled campaigns</p>
               </div>
            </div>
            <div className="p-24 text-center space-y-8">
              <div className="h-20 w-20 rounded-[32px] bg-muted dark:bg-white/3 border border-border dark:border-white/10 flex items-center justify-center mx-auto text-muted-foreground/40 dark:text-white/10">
                <Mail className="h-10 w-10 capitalize" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-foreground dark:text-white italic uppercase tracking-tighter leading-none">No Campaigns Yet</h4>
                <p className="max-w-xs mx-auto text-[10px] font-bold text-muted-foreground/70 dark:text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                  Create your first email campaign to start reaching attendees and contacts.
                </p>
              </div>
              <Button className="h-14 px-10 rounded-2xl bg-card dark:bg-white/10 hover:bg-primary text-foreground dark:text-white border border-border dark:border-white/10 font-black italic uppercase tracking-widest transition-all" onClick={() => setCreateOpen(true)}>
                Create Campaign
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="automations" className="mt-0 outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { name: "Registration Confirmation", trigger: "After attendee signup", status: "Offline", icon: Zap },
              { name: "Ticket Delivery", trigger: "After order completion", status: "Offline", icon: Ticket },
              { name: "Event Reminder", trigger: "24 hours before start", status: "Offline", icon: Bell },
              { name: "Follow-up", trigger: "After event end", status: "Offline", icon: CheckCircle },
            ].map((a, i) => (
              <motion.div key={a.name} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="p-10 rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-between group hover:bg-muted/60 dark:hover:bg-white/8 transition-all">
                <div className="flex items-center gap-8">
                  <div className="h-14 w-14 rounded-2xl bg-muted dark:bg-white/5 flex items-center justify-center text-muted-foreground dark:text-white/20 group-hover:text-primary group-hover:scale-110 transition-all border border-border dark:border-white/5">
                     <a.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-foreground dark:text-white italic uppercase tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">{a.name}</h4>
                   <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/20 uppercase tracking-widest">Trigger: {a.trigger}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <Badge className="bg-muted dark:bg-white/10 text-muted-foreground dark:text-white/40 border-none px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest italic">{a.status}</Badge>
                   <Button variant="ghost" className="h-10 w-10 p-0 text-muted-foreground/70 dark:text-white/10 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5 rounded-xl"><ArrowRight className="h-5 w-5" /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-0 outline-none">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaignTemplates.map((t, i) => (
              <motion.div key={t.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05 }} className="group rounded-[40px] bg-card/90 dark:bg-white/5 border border-border dark:border-white/10 p-10 flex flex-col justify-between hover:bg-muted/60 dark:hover:bg-white/8 transition-all relative overflow-hidden min-h-[300px]">
                <div className="relative z-10">
                   <div className={cn("p-4 w-fit rounded-2xl mb-8 transition-transform group-hover:rotate-12", t.bg, t.color)}>
                     <t.icon className="h-8 w-8" />
                   </div>
                   <h3 className="text-2xl font-black text-foreground dark:text-white italic uppercase tracking-tighter mb-4">{t.name}</h3>
                   <p className="text-[10px] font-bold text-muted-foreground dark:text-white/30 uppercase tracking-[0.2em] leading-relaxed">{t.description}</p>
                </div>
                <Button className="relative z-10 mt-10 h-14 w-full rounded-2xl bg-card dark:bg-white/5 border border-border dark:border-white/10 text-foreground dark:text-white group-hover:bg-primary transition-all font-black italic uppercase tracking-widest text-xs">
                   Use Template
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

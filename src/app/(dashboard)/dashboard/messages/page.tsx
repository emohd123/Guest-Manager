"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  MessageSquare, Reply, Clock, User, Mail, 
  ChevronRight, Check, Loader2, Send, Bell,
  Activity, Zap, Search, Target, ShieldCheck,
  ArrowRight, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VisitorMessage {
  id: string;
  eventId: string;
  eventName: string | null;
  guestEmail: string;
  guestName: string | null;
  subject: string | null;
  body: string;
  isRead: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VisitorMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/messages");
      const data = await res.json() as { messages: VisitorMessage[]; unreadCount: number };
      setMessages(data.messages ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const selectMessage = (msg: VisitorMessage) => {
    setSelected(msg);
    setReplyText(msg.adminReply ?? "");
    setReplyError(null);
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/dashboard/messages/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setReplyError(d.error ?? "FAILURE");
        return;
      }
      await fetchMessages();
      setSelected((prev) => prev ? { ...prev, adminReply: replyText.trim(), repliedAt: new Date().toISOString() } : null);
    } catch {
      setReplyError("RETRY CONNECTION");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 mb-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Messages</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             {unreadCount > 0 ? `${unreadCount} UNREAD MESSAGES` : "NO UNREAD MESSAGES"}
          </p>
        </motion.div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Signal List (Left) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-[40px] bg-white/5 border border-white/10 flex flex-col overflow-hidden backdrop-blur-xl"
        >
          <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Incoming Frequency</span>
             <Search className="h-4 w-4 text-white/20 hover:text-white cursor-pointer transition-colors" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {loading ? (
              <div className="p-20 text-center space-y-4">
                 <Activity className="h-6 w-6 text-primary mx-auto animate-spin" />
                 <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">Scanning...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                 <Target className="h-8 w-8 text-white/5 mx-auto" />
                 <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">No Messages</p>
              </div>
            ) : (
              messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => selectMessage(msg)}
                  className={cn(
                    "w-full text-left p-6 rounded-[24px] transition-all relative group flex flex-col gap-3 border border-transparent",
                    selected?.id === msg.id 
                      ? "bg-primary/10 border-primary/20" 
                      : "hover:bg-white/5 hover:border-white/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!msg.isRead && !msg.adminReply && (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                        )}
                        <p className={cn(
                          "font-black italic text-sm tracking-tight uppercase truncate transition-colors",
                          selected?.id === msg.id ? "text-primary" : "text-white group-hover:text-primary"
                        )}>
                          {msg.guestName || msg.guestEmail}
                        </p>
                      </div>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mt-1 italic">{msg.guestEmail}</p>
                    </div>
                    <span className="text-[10px] font-black text-white/10 tracking-tighter uppercase italic">{formatDate(msg.createdAt)}</span>
                  </div>
                  
                  <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest line-clamp-2">
                     {msg.subject && <span className="text-primary/60">{msg.subject}: </span>}
                     {msg.body}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                     {msg.adminReply ? (
                        <Badge className="bg-green-500/10 text-green-500 border-none rounded-full px-3 py-0.5 font-black text-[8px] uppercase tracking-widest italic">RESOLVED</Badge>
                     ) : (
                        <Badge className="bg-primary/10 text-primary border-none rounded-full px-3 py-0.5 font-black text-[8px] uppercase tracking-widest italic">PENDING</Badge>
                     )}
                     {msg.eventName && (
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-widest flex items-center gap-1">
                           <Hash className="h-2 w-2" /> {msg.eventName}
                        </span>
                     )}
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Signal Detail (Right) */}
        <div className="flex-1 flex flex-col min-h-0 bg-white/3 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div 
                key={selected.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col h-full"
              >
                {/* User Detail Header */}
                <div className="p-10 border-b border-white/5 bg-white/2 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center font-black italic text-xl text-primary shadow-2xl shadow-primary/10">
                       {(selected.guestName || selected.guestEmail).charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{selected.guestName || "ANON_UNIT"}</h2>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic flex items-center gap-2">
                           <Mail className="h-3 w-3" /> {selected.guestEmail}
                        </span>
                        {selected.eventName && (
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic flex items-center gap-2">
                             <Target className="h-3 w-3" /> {selected.eventName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Interception Time</p>
                     <p className="text-lg font-black text-white italic tracking-tight">{formatDate(selected.createdAt)}</p>
                  </div>
                </div>

                {/* Body Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
                   <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 relative group">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6 italic flex items-center gap-2">
                         <Zap className="h-3 w-3 text-primary animate-pulse" />
                         Message
                      </p>
                      {selected.subject && (
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-4 leading-none">{selected.subject}</h3>
                      )}
                      <p className="text-sm font-bold text-white/60 tracking-widest leading-relaxed uppercase">
                         {selected.body}
                      </p>
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ShieldCheck className="h-6 w-6 text-primary/20" />
                      </div>
                   </div>

                   {/* Existing Response */}
                   {selected.adminReply && (
                     <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-10 rounded-[40px] bg-green-500/5 border border-green-500/10 relative">
                        <p className="text-[10px] font-black text-green-500/40 uppercase tracking-[0.3em] mb-6 italic flex items-center gap-2">
                           <Reply className="h-3 w-3" /> Reply Sent
                        </p>
                        <p className="text-sm font-bold text-green-500/60 tracking-widest leading-relaxed uppercase">
                           {selected.adminReply}
                        </p>
                        <div className="absolute top-6 right-10 text-[9px] font-black text-green-500/20 uppercase tracking-widest font-mono italic">
                           SENT: {formatDate(selected.repliedAt || "")}
                        </div>
                     </motion.div>
                   )}
                </div>

                {/* Reply Interface */}
                <div className="p-10 bg-white/2 border-t border-white/5">
                   <div className="relative group">
                      <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 to-transparent rounded-[32px] blur-xs group-focus-within:opacity-100 opacity-0 transition-opacity" />
                      <div className="relative bg-slate-950/50 rounded-[32px] border border-white/10 p-2 flex gap-4 items-end">
                        <textarea
                          className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-black text-white italic uppercase tracking-[0.2em] placeholder:text-white/10 min-h-[140px] p-8 custom-scrollbar resize-none"
                          placeholder="Write your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="p-4 flex flex-col gap-4">
                           <Button
                             onClick={sendReply}
                             disabled={replying || !replyText.trim()}
                             className="h-20 w-20 rounded-[28px] bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-[1.1] active:scale-90 transition-all flex flex-col items-center justify-center p-0 disabled:opacity-20"
                           >
                             {replying ? <Loader2 className="h-8 w-8 animate-spin" /> : <Send className="h-8 w-8" />}
                             <span className="text-[8px] font-black mt-1">SEND</span>
                           </Button>
                        </div>
                      </div>
                   </div>
                   {replyError && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-4 ml-8 animate-pulse italic">Reply failed: {replyError}</p>}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-20">
                <div className="h-24 w-24 rounded-[40px] bg-white/2 border border-white/5 flex items-center justify-center text-white/5">
                   <MessageSquare className="h-12 w-12" />
                </div>
                <div className="text-center space-y-2">
                   <h3 className="text-2xl font-black text-white/10 italic uppercase tracking-tighter">No Message Selected</h3>
                   <p className="text-[10px] font-bold text-white/5 uppercase tracking-[0.3em] italic">Choose a message from the inbox to read or reply</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


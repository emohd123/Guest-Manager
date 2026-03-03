"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Reply, Clock, User, Mail, ChevronRight, Check, Loader2, Send, Bell } from "lucide-react";

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
  if (diffH < 24) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffH < 168) return d.toLocaleDateString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
        setReplyError(d.error ?? "Failed to send reply");
        return;
      }
      await fetchMessages();
      setSelected((prev) => prev ? { ...prev, adminReply: replyText.trim(), repliedAt: new Date().toISOString() } : null);
    } catch {
      setReplyError("Network error. Please try again.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-zinc-900 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Messages</h1>
            <p className="text-sm text-zinc-500">
              Messages from attendees —{" "}
              {unreadCount > 0 ? (
                <span className="text-violet-600 font-semibold">{unreadCount} unread</span>
              ) : (
                "all caught up!"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Message list (left panel) */}
        <div className="w-full max-w-sm border-r bg-white dark:bg-zinc-900 flex flex-col overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-zinc-400 gap-3">
              <MessageSquare className="h-10 w-10 opacity-40" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => selectMessage(msg)}
                className={`w-full text-left px-5 py-4 border-b hover:bg-violet-50 dark:hover:bg-zinc-800 transition-colors ${
                  selected?.id === msg.id ? "bg-violet-50 dark:bg-zinc-800 border-l-2 border-l-violet-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!msg.isRead && !msg.adminReply && (
                        <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                      )}
                      <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                        {msg.guestName ?? msg.guestEmail}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{msg.guestEmail}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1">
                      {msg.subject ? <span className="font-medium">{msg.subject}: </span> : null}
                      {msg.body}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-zinc-400">{formatDate(msg.createdAt)}</span>
                    {msg.adminReply ? (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> Replied
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-300" />
                    )}
                  </div>
                </div>
                {msg.eventName && (
                  <div className="mt-1.5">
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full">
                      {msg.eventName}
                    </span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Message detail (right panel) */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-8 gap-6">
            {/* Guest info */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 font-bold text-lg">
                  {(selected.guestName ?? selected.guestEmail).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-zinc-900 dark:text-white text-lg">
                    {selected.guestName ?? "Attendee"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    {selected.guestEmail}
                  </div>
                  {selected.eventName && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-0.5">
                      <Bell className="h-3.5 w-3.5" />
                      {selected.eventName}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatDate(selected.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Message body */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              {selected.subject && (
                <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-3">{selected.subject}</h2>
              )}
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{selected.body}</p>
            </div>

            {/* Existing reply (if any) */}
            {selected.adminReply && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm mb-2">
                  <Reply className="h-4 w-4" /> Your reply
                  {selected.repliedAt && (
                    <span className="text-emerald-500 font-normal text-xs ml-auto">
                      {formatDate(selected.repliedAt)}
                    </span>
                  )}
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap text-sm">{selected.adminReply}</p>
              </div>
            )}

            {/* Reply box */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                {selected.adminReply ? "Update reply" : "Reply to attendee"}
              </label>
              <textarea
                className="w-full min-h-[120px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Type your reply here…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              {replyError && (
                <p className="text-red-500 text-xs mt-1">{replyError}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-zinc-400">
                  The attendee will receive an in-app notification with your reply.
                </p>
                <button
                  onClick={sendReply}
                  disabled={replying || !replyText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {replying ? "Sending…" : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-4">
            <MessageSquare className="h-16 w-16 opacity-20" />
            <div className="text-center">
              <p className="font-semibold text-zinc-500">Select a message</p>
              <p className="text-sm">to read and reply</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

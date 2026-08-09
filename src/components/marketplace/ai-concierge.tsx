"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, X, BadgeCheck } from "lucide-react";
import { formatMoney, type LocaleCode } from "@/lib/marketplace";
import { StarBorder } from "@/components/visual/reactbits";
import type { MarketplaceEvent } from "@/types/marketplace";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  events?: MarketplaceEvent[];
  source?: "claude" | "smart";
};

type AskAiDetail = { eventId: string; title: string };

/**
 * Floating "Ask AI" concierge for the marketplace.
 * Other components can open it focused on one event by dispatching:
 *   window.dispatchEvent(new CustomEvent("eh-ask-ai", { detail: { eventId, title } }))
 */
export function AiConcierge({ locale }: { locale: LocaleCode }) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [eventContext, setEventContext] = useState<AskAiDetail | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (raw: Event) => {
      const detail = (raw as CustomEvent<AskAiDetail>).detail;
      if (!detail?.eventId) return;
      setEventContext(detail);
      setOpen(true);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: ar
            ? `اسألني أي شي عن «${detail.title}» — الوقت، المكان، الأسعار…`
            : `Ask me anything about “${detail.title}” — times, venue, prices…`,
        },
      ]);
    };
    window.addEventListener("eh-ask-ai", handler);
    return () => window.removeEventListener("eh-ask-ai", handler);
  }, [ar]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const suggestions = ar
    ? ["شنو في الليلة؟", "فعاليات عائلية بالويكند", "حفلات تحت 20 دينار"]
    : ["What's on tonight?", "Family plans this weekend", "Concerts under BHD 20"];

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    const history = messages
      .filter((m) => !m.events)
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));
    setMessages((current) => [...current, { role: "user", text: message }]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: eventContext ? "event-qa" : "concierge",
          eventId: eventContext?.eventId,
          message,
          history,
          locale,
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        events?: MarketplaceEvent[];
        source?: "claude" | "smart";
        error?: string;
      };
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.reply || data.error || (ar ? "صار خطأ، جرّب مرة ثانية." : "Something went wrong — try again."),
          events: data.events?.slice(0, 3),
          source: data.source,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: ar ? "تعذر الاتصال — تأكد من الشبكة." : "Couldn't reach the assistant — check your connection." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* FAB */}
      {!open ? (
        <StarBorder className="fixed bottom-24 right-4 z-[60] shadow-[0_10px_40px_rgba(34,211,238,0.35)] sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black text-white transition hover:scale-[1.03] sm:gap-2 sm:px-5 sm:py-3.5 sm:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300 sm:h-4 sm:w-4" />
            {ar ? "اسأل الذكاء" : "Ask AI"}
          </button>
        </StarBorder>
      ) : null}

      {/* Panel */}
      {open ? (
        <div className="fixed bottom-20 right-3 z-[60] flex h-[min(560px,calc(100dvh-7rem))] w-[min(94vw,400px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.20)] sm:bottom-4 sm:right-4 sm:h-[560px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-black leading-tight">{ar ? "مساعد الفعاليات" : "Events concierge"}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {eventContext
                    ? (ar ? "عن: " : "About: ") + eventContext.title.slice(0, 26)
                    : ar ? "البحرين · مباشر" : "Bahrain · live data"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {eventContext ? (
                <button
                  type="button"
                  onClick={() => setEventContext(null)}
                  className="rounded-full border border-slate-300 px-2.5 py-1 text-[10px] font-black text-slate-500 hover:text-slate-900"
                >
                  {ar ? "سؤال عام" : "All events"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close AI chat"
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-slate-600">
                  {ar
                    ? "أهلاً! أنا دليلك لفعاليات البحرين. قلّي شنو تحب — نوع الفعالية، الميزانية، أو الوقت — وأرشّح لك من الفعاليات المتوفرة فعلاً."
                    : "Hi! I'm your guide to what's on in Bahrain. Tell me what you're after — a vibe, a budget, a night — and I'll pick from real listed events."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-slate-900"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-r from-blue-600 to-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white"
                      : "max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm leading-6 text-slate-800"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.events?.length ? (
                    <div className="mt-3 space-y-2">
                      {message.events.map((event) => (
                        <Link
                          key={event.id}
                          href={event.buyUrl}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:border-blue-300"
                        >
                          {event.coverImageUrl ? (
                            <img src={event.coverImageUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-white/10">🎟</span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black text-slate-900">
                              {ar && event.titleAr ? event.titleAr : event.title}
                            </span>
                            <span className="block text-[11px] font-bold text-blue-600">
                              {formatMoney(event.minPrice, event.currency, locale)}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-black">
                            {ar ? "احجز" : "Book"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {message.role === "assistant" && message.source ? (
                    <p className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <BadgeCheck className="h-3 w-3" />
                      {message.source === "smart" ? (ar ? "بحث ذكي" : "Smart search") : ar ? "إجابة ذكاء اصطناعي" : "AI answer"}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Composer */}
          <form
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-3"
          >
            <input
              value={input}
              onChange={(changeEvent) => setInput(changeEvent.target.value)}
              placeholder={ar ? "اكتب سؤالك…" : "Ask about events…"}
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={ar ? "إرسال" : "Send"}
              className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 p-2.5 text-white transition enabled:hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

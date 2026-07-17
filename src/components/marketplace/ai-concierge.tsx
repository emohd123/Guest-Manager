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
        <StarBorder className="fixed bottom-6 right-6 z-40 shadow-[0_10px_40px_rgba(34,211,238,0.35)]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-black text-white transition hover:scale-[1.03]"
          >
            <Sparkles className="h-4 w-4 text-cyan-300" />
            {ar ? "اسأل الذكاء" : "Ask AI"}
          </button>
        </StarBorder>
      ) : null}

      {/* Panel */}
      {open ? (
        <div className="fixed bottom-4 right-4 z-50 flex h-[560px] w-[min(94vw,400px)] flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#080d19]/98 text-white shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-black leading-tight">{ar ? "مساعد الفعاليات" : "Events concierge"}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
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
                  className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-black text-white/70 hover:text-white"
                >
                  {ar ? "سؤال عام" : "All events"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close AI chat"
                className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-white/70">
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
                      className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-white/75 transition hover:border-cyan-300/50 hover:text-white"
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
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-cyan-300 px-3.5 py-2.5 text-sm font-semibold text-black"
                      : "max-w-[92%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm leading-6 text-white/85"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.events?.length ? (
                    <div className="mt-3 space-y-2">
                      {message.events.map((event) => (
                        <Link
                          key={event.id}
                          href={event.buyUrl}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2 transition hover:border-cyan-300/40"
                        >
                          {event.coverImageUrl ? (
                            <img src={event.coverImageUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-white/10">🎟</span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black text-white">
                              {ar && event.titleAr ? event.titleAr : event.title}
                            </span>
                            <span className="block text-[11px] font-bold text-cyan-200/85">
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
                    <p className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/35">
                      <BadgeCheck className="h-3 w-3" />
                      {message.source === "smart" ? (ar ? "بحث ذكي" : "Smart search") : ar ? "إجابة ذكاء اصطناعي" : "AI answer"}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-4 py-3">
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
            className="flex items-center gap-2 border-t border-white/10 p-3"
          >
            <input
              value={input}
              onChange={(changeEvent) => setInput(changeEvent.target.value)}
              placeholder={ar ? "اكتب سؤالك…" : "Ask about events…"}
              className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-cyan-300/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={ar ? "إرسال" : "Send"}
              className="rounded-full bg-cyan-300 p-2.5 text-black transition enabled:hover:bg-cyan-200 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";
import { Sparkles, PenLine, Languages, LineChart, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tool = "digest" | "writer" | "translate";

export type AiDigestStats = {
  totalEvents: number;
  totalGuests: number;
  checkIns: number;
  upcomingEvents: number;
};

/**
 * Organiser AI tools: weekly digest, listing writer, EN<->AR translator.
 * All three call /api/ai — real Claude when ANTHROPIC_API_KEY is set,
 * smart templates otherwise.
 */
export function AiToolsCard({ stats }: { stats: AiDigestStats }) {
  const [tool, setTool] = useState<Tool>("digest");
  const [input, setInput] = useState("");
  const [targetLang, setTargetLang] = useState<"ar" | "en">("ar");
  const [output, setOutput] = useState("");
  const [source, setSource] = useState<"claude" | "smart" | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const tabs: { key: Tool; label: string; icon: typeof Sparkles }[] = [
    { key: "digest", label: "Weekly digest", icon: LineChart },
    { key: "writer", label: "Listing writer", icon: PenLine },
    { key: "translate", label: "Translate", icon: Languages },
  ];

  async function run() {
    if (busy) return;
    setBusy(true);
    setOutput("");
    setCopied(false);
    try {
      const body =
        tool === "digest"
          ? { mode: "digest", stats, locale: "en" }
          : tool === "writer"
            ? { mode: "listing-writer", bullets: input, locale: "en" }
            : { mode: "translate", text: input, targetLang, locale: "en" };
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { reply?: string; source?: "claude" | "smart"; error?: string };
      setOutput(data.reply || data.error || "No output.");
      setSource(data.source ?? null);
    } catch {
      setOutput("Request failed — check your connection and try again.");
      setSource(null);
    } finally {
      setBusy(false);
    }
  }

  const needsInput = tool !== "digest";
  const runDisabled = busy || (needsInput && !input.trim());

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-black italic tracking-tight text-foreground dark:text-white">AI Tools</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground dark:text-white/35">
              Digest · Writing · Arabic
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setTool(tab.key); setOutput(""); setSource(null); }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition",
                tool === tab.key
                  ? "bg-primary text-white"
                  : "border border-border text-muted-foreground hover:text-foreground dark:border-white/12 dark:text-white/60 dark:hover:text-white"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {tool === "digest" ? (
          <p className="mb-4 text-sm text-muted-foreground dark:text-white/55">
            Turns this week&apos;s numbers ({stats.totalEvents} events · {stats.totalGuests} guests · {stats.checkIns} check-ins)
            into a plain-language summary with one suggestion.
          </p>
        ) : (
          <div className="mb-4 space-y-2">
            {tool === "translate" ? (
              <div className="flex gap-2">
                {(["ar", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTargetLang(lang)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-black",
                      targetLang === lang
                        ? "bg-cyan-400 text-black"
                        : "border border-border text-muted-foreground dark:border-white/12 dark:text-white/55"
                    )}
                  >
                    {lang === "ar" ? "→ العربية" : "→ English"}
                  </button>
                ))}
              </div>
            ) : null}
            <textarea
              value={input}
              onChange={(changeEvent) => setInput(changeEvent.target.value)}
              rows={4}
              placeholder={
                tool === "writer"
                  ? "Bullet points about your event…\ne.g. Rooftop jazz night • Fri 8pm • Adliya • BHD 12 • live trio + dinner"
                  : "Paste the text to translate…"
              }
              className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none dark:border-white/12 dark:bg-black/30 dark:text-white"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={run} disabled={runDisabled} className="rounded-full px-6 font-black">
            {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}
            {tool === "digest" ? "Generate digest" : tool === "writer" ? "Write listing" : "Translate"}
          </Button>
          {source ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/35">
              {source === "claude" ? "AI generated" : "Smart template"}
            </span>
          ) : null}
        </div>

        {output ? (
          <div className="relative mt-4 rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-black/30">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(output);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="absolute right-3 top-3 rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground dark:border-white/12 dark:text-white/50 dark:hover:text-white"
              aria-label="Copy output"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap pr-8 font-sans text-sm leading-6 text-foreground dark:text-white/85">{output}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

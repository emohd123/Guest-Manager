"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { RefreshCw, UserRound } from "lucide-react";

type Question = { id: string; attendeeName: string; body: string; createdAt: string };

export default function SpeakerQuestionsPage() {
  const params = useParams<{ eventId: string; sessionId: string }>();
  const search = useSearchParams();
  const [code, setCode] = useState(search.get("code") ?? "");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/private-events/speaker-questions?eventId=${encodeURIComponent(params.eventId)}&sessionId=${encodeURIComponent(params.sessionId)}&code=${encodeURIComponent(code)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load questions.");
      setTitle(payload.session.title); setQuestions(payload.questions);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load questions."); } finally { setLoading(false); }
  }, [code, params.eventId, params.sessionId]);
  useEffect(() => { if (!code.trim()) return; void load(); const timer = window.setInterval(() => void load(), 5000); return () => window.clearInterval(timer); }, [code, load]);

  return <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 dark:bg-[#080b12] dark:text-white"><div className="mx-auto max-w-3xl"><p className="text-xs font-black uppercase tracking-[.22em] text-cyan-700 dark:text-cyan-300">iTicket speaker access</p><h1 className="mt-2 text-3xl font-black">Live attendee questions</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Enter the private speaker code shared by the organiser. New questions refresh automatically.</p><div className="mt-6 flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Speaker access code" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none dark:border-white/15 dark:bg-[#121722]" /><button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-black text-white"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Open</button></div>{error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}{title && <section className="mt-8"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">{title}</h2><span className="text-sm text-slate-500">{questions.length} question{questions.length === 1 ? "" : "s"}</span></div><div className="mt-4 space-y-3">{questions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-white/15 dark:bg-[#121722]">No questions yet. Keep this page open during the session.</div> : questions.map((question) => <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121722]"><p className="flex items-center gap-2 font-black"><UserRound className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />{question.attendeeName}</p><p className="mt-3 leading-7">{question.body}</p><p className="mt-3 text-xs text-slate-500">{new Date(question.createdAt).toLocaleString()}</p></article>)}</div></section>}</div></main>;
}

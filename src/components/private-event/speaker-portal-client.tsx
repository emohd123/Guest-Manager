"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { FileUp, LogOut, MessageCircleQuestion, RefreshCw, Upload, UserRound } from "lucide-react";

type Session = { id: string; title: string; startsAt?: string | null; location?: string | null };
type Question = { id: string; sessionId: string; attendeeName: string; body: string; createdAt: string };
type Resource = { id: string; title: string; url: string; fileType?: string; uploadedBy?: string; sessionId?: string };
type SpeakerData = { conference: { id: string; title: string }; speakerName: string; sessions: Session[]; questions: Question[]; resources: Resource[] };

export function SpeakerPortalClient() {
  const [data, setData] = useState<SpeakerData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/private-events/speaker", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "We could not load the speaker portal.");
      setData(payload); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not load the speaker portal."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 5000); return () => window.clearInterval(timer); }, [load]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true); setError("");
    try {
      const body = new FormData(); body.set("file", file); body.set("title", title.trim()); if (sessionId) body.set("sessionId", sessionId);
      const response = await fetch("/api/private-events/speaker/resources", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Upload failed.");
      setFile(null); setTitle(""); setSessionId("");
      const input = document.getElementById("speaker-resource-file") as HTMLInputElement | null; if (input) input.value = "";
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed."); }
    finally { setUploading(false); }
  }

  async function signOut() { await fetch("/api/private-events/signout", { method: "POST" }); window.location.assign("/private-event"); }
  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-900 dark:bg-[#080b12] dark:text-white"><RefreshCw className="h-7 w-7 animate-spin text-cyan-600" /></main>;
  if (!data) return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center text-slate-900 dark:bg-[#080b12] dark:text-white"><div><h1 className="text-2xl font-black">Speaker portal unavailable</h1><p className="mt-2 text-slate-600 dark:text-slate-300">{error || "Please sign in with your speaker details."}</p></div></main>;

  return <main className="min-h-screen bg-slate-50 pb-14 text-slate-900 dark:bg-[#080b12] dark:text-white"><header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#0b101a]/90"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Speaker workspace</p><h1 className="mt-1 text-lg font-black">{data.conference.title}</h1></div><button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-black dark:border-white/15"><LogOut className="h-4 w-4" />Sign out</button></div></header><div className="mx-auto max-w-6xl space-y-8 px-5 py-8"><section className="rounded-3xl bg-slate-950 p-7 text-white"><p className="text-sm font-bold text-cyan-200">Welcome, {data.speakerName}</p><h2 className="mt-2 text-3xl font-black">Your speaker workspace</h2><p className="mt-3 max-w-2xl text-slate-200">Review attendee questions for your sessions and share presentation files directly with conference attendees.</p></section>{error && <p className="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}<section className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121722]"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Live engagement</p><h2 className="mt-1 text-2xl font-black">Attendee questions</h2></div><button onClick={() => void load()} className="rounded-xl border border-slate-300 p-2 dark:border-white/15" aria-label="Refresh questions"><RefreshCw className="h-4 w-4" /></button></div><div className="mt-5 space-y-3">{data.questions.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/15 dark:text-slate-300">No questions yet. This updates automatically while you keep the page open.</p> : data.questions.map((question) => <article key={question.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><p className="flex items-center gap-2 text-sm font-black"><UserRound className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />{question.attendeeName}</p><p className="mt-3 leading-6">{question.body}</p><p className="mt-3 text-xs text-slate-500">{data.sessions.find((session) => session.id === question.sessionId)?.title ?? "Your session"} · {new Date(question.createdAt).toLocaleString()}</p></article>)}</div></article><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121722]"><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Your sessions</p><h2 className="mt-1 text-2xl font-black">Programme</h2><div className="mt-5 space-y-3">{data.sessions.map((session) => <div key={session.id} className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><p className="font-black">{session.title}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{session.startsAt ? new Date(session.startsAt).toLocaleString() : "Time to be confirmed"}{session.location ? ` · ${session.location}` : ""}</p></div>)}</div></article></section><section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121722]"><div className="flex items-center gap-2"><FileUp className="h-5 w-5 text-cyan-600 dark:text-cyan-300" /><h2 className="text-xl font-black">Share a resource</h2></div><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Upload PDFs, PowerPoint, Word, Excel, JPG, or PNG files (up to 25 MB). They appear in attendee resources immediately.</p><form onSubmit={upload} className="mt-5 space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Resource title" className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-white/5" /><select value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-white/5"><option value="">Available to all attendees</option>{data.sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}</select><input id="speaker-resource-file" type="file" accept=".pdf,.pptx,.docx,.xlsx,.jpg,.jpeg,.png" required onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} className="block w-full text-sm" /><button disabled={uploading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 font-black text-slate-950 disabled:opacity-60"><Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Publish resource"}</button></form></article><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121722]"><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">Resource centre</p><h2 className="mt-1 text-2xl font-black">Shared with attendees</h2><div className="mt-5 space-y-2">{data.resources.length === 0 ? <p className="text-sm text-slate-500">No resources have been published yet.</p> : data.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:border-cyan-400 dark:border-white/10"><span>{resource.title}{resource.uploadedBy ? <span className="ml-2 text-xs font-normal text-slate-500">by {resource.uploadedBy}</span> : null}</span><MessageCircleQuestion className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /></a>)}</div></article></section></div></main>;
}

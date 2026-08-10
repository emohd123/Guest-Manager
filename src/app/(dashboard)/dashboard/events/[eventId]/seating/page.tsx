"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair,
  ChevronLeft,
  Grid3X3,
  ImagePlus,
  Layers3,
  Loader2,
  MousePointer2,
  Redo2,
  Save,
  Sparkles,
  Square,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerHallMap } from "@/components/seating/CustomerHallMap";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { getSeatDensity } from "@/components/seating/layout-density";

type Seat = {
  id: string;
  label: string;
  x: number;
  y: number;
  price: number | null;
  color: string | null;
  category: string | null;
  status: "available" | "blocked";
  sold?: boolean;
  held?: boolean;
};

type Row = {
  id: string;
  label: string;
  price: number | null;
  color: string | null;
  seats: Seat[];
};

type Section = {
  id: string;
  name: string;
  price: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  seatSpacing: number;
  rowSpacing: number;
  rows: Row[];
};

type Stage = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type Snapshot = { sections: Section[]; stages: Stage[] };
type Selection = {
  section: number | null;
  row: number | null;
  seats: string[];
  stage: number | null;
};

const COLORS = ["#2563eb", "#9333ea", "#ef4444", "#06b6d4", "#f59e0b", "#10b981"];
const SNAP = 2;
const EMPTY_SELECTION: Selection = {
  section: null,
  row: null,
  seats: [],
  stage: null,
};

const uid = () => crypto.randomUUID();
const clone = <T,>(value: T): T => structuredClone(value);
const snap = (value: number) => Math.max(0, Math.min(100, Math.round(value / SNAP) * SNAP));

function normalizePlan(plan: any): { sections: Section[]; stages: Stage[] } {
  return {
    sections: (plan?.sections ?? []).map((section: any, sectionIndex: number) => ({
      id: section.id ?? uid(),
      name: section.name ?? `Section ${sectionIndex + 1}`,
      price: section.price ?? null,
      x: section.x ?? 50,
      y: section.y ?? 45,
      width: section.width ?? 30,
      height: section.height ?? 28,
      rotation: section.rotation ?? 0,
      color: section.color ?? COLORS[sectionIndex % COLORS.length],
      seatSpacing: section.seat_spacing ?? 100,
      rowSpacing: section.row_spacing ?? 100,
      rows: (section.rows ?? []).map((row: any, rowIndex: number) => ({
        id: row.id ?? uid(),
        label: row.label ?? String.fromCharCode(65 + rowIndex),
        price: row.price ?? null,
        color: row.color ?? null,
        seats: (row.seats ?? []).map((seat: any, seatIndex: number) => ({
          id: seat.id ?? uid(),
          label: seat.label ?? String(seatIndex + 1),
          x: seat.x ?? 50,
          y: seat.y ?? 50,
          price: seat.price ?? null,
          color: seat.color ?? null,
          category: seat.category ?? null,
          status: seat.inventory_status === "blocked" ? "blocked" : "available",
          sold: Boolean(seat.sold_ticket_id),
          held: (seat.seat_holds ?? []).some(
            (hold: any) =>
              hold.status === "pending" && new Date(hold.expires_at).getTime() > Date.now(),
          ),
        })),
      })),
    })),
    stages: (plan?.metadata?.labels ?? []).map((label: any) => ({
      id: label.id ?? uid(),
      text: label.text ?? "STAGE",
      x: label.x ?? 50,
      y: label.y ?? 10,
      width: label.width ?? 34,
      height: label.height ?? 10,
      color: label.color ?? "#64748b",
    })),
  };
}

function makeRows(rowCount: number, seatsPerRow: number): Row[] {
  return Array.from({ length: rowCount }, (_, rowIndex) => ({
    id: uid(),
    label: String.fromCharCode(65 + rowIndex),
    price: null,
    color: null,
    seats: Array.from({ length: seatsPerRow }, (_, seatIndex) => ({
      id: uid(),
      label: String(seatIndex + 1),
      x: Math.round(((seatIndex + 1) / (seatsPerRow + 1)) * 100),
      y: Math.round(((rowIndex + 1) / (rowCount + 1)) * 100),
      price: null,
      color: null,
      category: null,
      status: "available" as const,
    })),
  }));
}

export default function SeatingBuilderPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data: savedPlan, isLoading } = trpc.seating.get.useQuery({ eventId });
  const savePlan = trpc.seating.save.useMutation({
    onSuccess: () => toast.success("Seat map saved. Customer preview is now up to date."),
    onError: (error) => toast.error(error.message),
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [enabled, setEnabled] = useState(false);
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rowCount, setRowCount] = useState(6);
  const [seatsPerRow, setSeatsPerRow] = useState(12);
  const [batchPrice, setBatchPrice] = useState("15");
  const [batchColor, setBatchColor] = useState(COLORS[0]);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<any>(null);

  useEffect(() => {
    if (loaded || isLoading) return;
    const normalized = normalizePlan(savedPlan);
    setSections(normalized.sections);
    setStages(normalized.stages);
    setEnabled(Boolean(savedPlan?.enabled));
    setFloorPlanUrl(savedPlan?.floor_plan_url ?? "");
    setLoaded(true);
  }, [isLoading, loaded, savedPlan]);

  const lockedInventory = useMemo(
    () => sections.some((section) => section.rows.some((row) => row.seats.some((seat) => seat.sold || seat.held))),
    [sections],
  );
  const seatCount = useMemo(
    () => sections.reduce((total, section) => total + section.rows.reduce((sum, row) => sum + row.seats.length, 0), 0),
    [sections],
  );

  function checkpoint() {
    setUndoStack((items) => [...items.slice(-29), clone({ sections, stages })]);
    setRedoStack([]);
  }

  function restore(snapshot: Snapshot) {
    setSections(clone(snapshot.sections));
    setStages(clone(snapshot.stages));
    setSelection(EMPTY_SELECTION);
  }

  function undo() {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((items) => [...items, clone({ sections, stages })]);
    setUndoStack((items) => items.slice(0, -1));
    restore(previous);
  }

  function redo() {
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((items) => [...items, clone({ sections, stages })]);
    setRedoStack((items) => items.slice(0, -1));
    restore(next);
  }

  function addStage() {
    checkpoint();
    setStages((items) => [...items, { id: uid(), text: "STAGE", x: 50, y: 12, width: 36, height: 10, color: "#64748b" }]);
    setSelection({ ...EMPTY_SELECTION, stage: stages.length });
  }

  function addSection() {
    checkpoint();
    const index = sections.length;
    setSections((items) => [
      ...items,
      {
        id: uid(),
        name: `Section ${index + 1}`,
        price: null,
        x: 25 + (index % 3) * 25,
        y: 48,
        width: 22,
        height: 34,
        rotation: 0,
        color: COLORS[index % COLORS.length],
        seatSpacing: 100,
        rowSpacing: 100,
        rows: [],
      },
    ]);
    setSelection({ ...EMPTY_SELECTION, section: index });
  }

  function generateChairs() {
    if (selection.section === null) return toast.error("Select a section first.");
    const current = sections[selection.section];
    if (current.rows.length && lockedInventory)
      return toast.error("This plan contains held or sold seats. Destructive rebuilding is blocked.");
    if (current.rows.length && !confirm(`Replace all chairs in ${current.name}?`)) return;
    checkpoint();
    setSections((items) => items.map((section, index) => index === selection.section ? { ...section, rows: makeRows(rowCount, seatsPerRow) } : section));
    setSelection((value) => ({ ...value, row: null, seats: [] }));
  }

  function deleteSelection() {
    if (lockedInventory) return toast.error("Held or sold inventory protects this plan from destructive changes.");
    checkpoint();
    if (selection.stage !== null) setStages((items) => items.filter((_, index) => index !== selection.stage));
    else if (selection.seats.length && selection.section !== null) {
      setSections((items) => items.map((section, si) => si !== selection.section ? section : {
        ...section,
        rows: section.rows.map((row) => ({ ...row, seats: row.seats.filter((seat) => !selection.seats.includes(seat.id)) })),
      }));
    } else if (selection.row !== null && selection.section !== null) {
      setSections((items) => items.map((section, si) => si === selection.section ? { ...section, rows: section.rows.filter((_, ri) => ri !== selection.row) } : section));
    } else if (selection.section !== null) setSections((items) => items.filter((_, index) => index !== selection.section));
    setSelection(EMPTY_SELECTION);
  }

  function applyPricing() {
    if (selection.section === null) return toast.error("Select a section, row, or chairs first.");
    const price = Math.round(Number(batchPrice) * 100);
    if (!Number.isFinite(price) || price < 0) return toast.error("Enter a valid BHD price.");
    checkpoint();
    setSections((items) => items.map((section, si) => {
      if (si !== selection.section) return section;
      if (selection.seats.length) return {
        ...section,
        rows: section.rows.map((row) => ({ ...row, seats: row.seats.map((seat) => selection.seats.includes(seat.id) ? { ...seat, price, color: batchColor, category: `${batchPrice} BHD` } : seat) })),
      };
      if (selection.row !== null) return {
        ...section,
        rows: section.rows.map((row, ri) => ri === selection.row ? { ...row, price, color: batchColor } : row),
      };
      return { ...section, price, color: batchColor };
    }));
    toast.success("Price and colour applied.");
  }

  function pointerPosition(event: React.PointerEvent) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return { x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 };
  }

  function beginMove(kind: "section" | "stage" | "resize-section" | "resize-stage", index: number, event: React.PointerEvent) {
    event.stopPropagation();
    checkpoint();
    const point = pointerPosition(event);
    const item = kind.includes("section") ? sections[index] : stages[index];
    dragRef.current = { kind, index, start: point, item: clone(item) };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePointer(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.kind === "pan") {
      setPan({
        x: drag.pan.x + event.clientX - drag.client.x,
        y: drag.pan.y + event.clientY - drag.client.y,
      });
      return;
    }
    const point = pointerPosition(event);
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    if (drag.kind === "section" || drag.kind === "resize-section") {
      setSections((items) => items.map((section, index) => index !== drag.index ? section : drag.kind === "section"
        ? { ...section, x: snap(drag.item.x + dx), y: snap(drag.item.y + dy) }
        : { ...section, width: Math.max(8, snap(drag.item.width + dx * 2)), height: Math.max(8, snap(drag.item.height + dy * 2)) }));
    } else {
      setStages((items) => items.map((stage, index) => index !== drag.index ? stage : drag.kind === "stage"
        ? { ...stage, x: snap(drag.item.x + dx), y: snap(drag.item.y + dy) }
        : { ...stage, width: Math.max(8, snap(drag.item.width + dx * 2)), height: Math.max(5, snap(drag.item.height + dy * 2)) }));
    }
  }

  async function uploadBackground(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose a PNG, JPEG, or WebP image.");
    setUploading(true);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const path = `floor-plans/${eventId}/${uid()}-${safeName}`;
      const { error } = await supabase.storage.from("events").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setFloorPlanUrl(supabase.storage.from("events").getPublicUrl(path).data.publicUrl);
      toast.success("Background reference uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function analyseFloorPlan() {
    if (!floorPlanUrl) return toast.error("Upload an image floor plan before analysing it.");
    setAnalysing(true);
    try {
      const response = await fetch(`/api/dashboard/events/${eventId}/seating/analyse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ floorPlanUrl, kind: "image", rows: rowCount, seatsPerRow }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Analysis failed");
      setProposal(data);
      toast.success(data.mode === "ai" ? "AI proposal is ready for review." : "Editable assisted proposal is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setAnalysing(false);
    }
  }

  function applyProposal() {
    if (!proposal?.proposal) return;
    if (lockedInventory) return toast.error("Held or sold inventory protects this plan from rebuilding.");
    checkpoint();
    const nextSections: Section[] = proposal.proposal.blocks.map((block: any, index: number) => ({
      id: uid(), name: block.name || `Section ${index + 1}`, price: Math.round(Number(block.price ?? 0) * 100),
      x: block.x, y: block.y, width: block.width, height: block.height, rotation: block.rotation ?? 0,
      color: block.color || COLORS[index % COLORS.length], seatSpacing: 100, rowSpacing: 100,
      rows: makeRows(block.rowCount, block.seatsPerRow),
    }));
    const stage = proposal.proposal.stage;
    setSections(nextSections);
    setStages(stage ? [{ id: uid(), text: stage.text || "STAGE", x: stage.x, y: stage.y, width: stage.width, height: 10, color: "#64748b" }] : []);
    setSelection(EMPTY_SELECTION);
    setProposal(null);
    toast.success("Proposal applied. Review the sections, chairs and prices, then save & publish.");
  }

  function save() {
    if (!sections.length || !seatCount) return toast.error("Add at least one section with chairs before saving.");
    savePlan.mutate({
      eventId,
      floorPlanUrl: floorPlanUrl || null,
      enabled,
      labels: stages,
      sections: sections.map((section) => ({
        name: section.name,
        price: section.price,
        x: Math.round(section.x), y: Math.round(section.y), width: Math.round(section.width), height: Math.round(section.height),
        rotation: Math.round(section.rotation), color: section.color, seatSpacing: section.seatSpacing, rowSpacing: section.rowSpacing,
        rows: section.rows.map((row) => ({
          label: row.label, price: row.price, color: row.color, seatCount: Math.max(1, row.seats.length),
          seatDetails: row.seats.map((seat) => ({ label: seat.label, x: Math.round(seat.x), y: Math.round(seat.y), price: seat.price, color: seat.color, category: seat.category, status: seat.status })),
        })),
      })),
    });
  }

  const previewPlan = useMemo(() => ({
    enabled: true,
    floor_plan_url: floorPlanUrl || null,
    metadata: { labels: stages },
    sections: sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({ ...row, seats: row.seats.map((seat) => ({
        ...seat, inventory_status: seat.status, unavailable: seat.status === "blocked" || seat.sold || seat.held,
      })) })),
    })),
  }), [floorPlanUrl, sections, stages]);

  if (isLoading || !loaded) return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;

  const activeSection = selection.section === null ? null : sections[selection.section];
  const activeStage = selection.stage === null ? null : stages[selection.stage];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#071018] dark:text-white">
      <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#09141d]">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/events/${eventId}`} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></Link>
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-cyan-600 dark:text-cyan-300">Seating designer</p><h1 className="text-xl font-black text-slate-950 dark:text-white">Build your hall map</h1></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-white/30 bg-white text-slate-950 hover:bg-slate-100" onClick={() => setPreview((value) => !value)}>{preview ? "Back to builder" : "Customer preview"}</Button>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/20 dark:bg-white/5 dark:text-white"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Map active</label>
            <Button onClick={save} disabled={savePlan.isPending || lockedInventory} className="bg-cyan-400 font-black text-slate-950 hover:bg-cyan-300"><Save className="mr-2 h-4 w-4" />{savePlan.isPending ? "Saving…" : "Save & publish map"}</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] p-4 lg:p-6">
        {lockedInventory ? <div className="mb-4 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-amber-100"><strong>Protected live inventory:</strong> this plan contains held or sold seats. Destructive rebuild, deletion and save are disabled so ticket assignments remain safe.</div> : null}

        {!preview ? <section className="mb-4 rounded-2xl border border-cyan-300/50 bg-cyan-50 p-4 dark:border-cyan-300/30 dark:bg-cyan-300/[0.07]">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-200"><Sparkles className="h-4 w-4" />Start with your floor plan</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-white/65">Step 1: upload a PNG, JPG or WebP. Step 2: analyse it to create an editable seating proposal. With OPENAI_API_KEY configured, iTicket uses vision analysis; otherwise it creates a clearly labelled assisted grid proposal for you to review.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || lockedInventory} className="border-cyan-500 bg-white font-black text-cyan-800 hover:bg-cyan-50 dark:border-cyan-300/50 dark:bg-white/10 dark:text-cyan-200 dark:hover:bg-white/20"><ImagePlus className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : floorPlanUrl ? "Replace floor plan" : "Upload floor plan"}</Button><Button onClick={analyseFloorPlan} disabled={!floorPlanUrl || analysing || lockedInventory} className="shrink-0 bg-cyan-500 font-black text-white hover:bg-cyan-600 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">{analysing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{analysing ? "Analysing…" : "Analyse floor plan"}</Button></div></div>
          {proposal ? <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4"><p className="font-black">{proposal.proposal.summary}</p><p className="mt-1 text-xs text-white/60">{proposal.reason}</p><div className="mt-3 flex flex-wrap gap-2">{proposal.proposal.blocks.map((block: any) => <span key={`${block.name}-${block.x}`} className="rounded-full border border-white/10 px-3 py-1 text-xs" style={{ color: block.color }}>{block.name}: {block.rowCount} rows × {block.seatsPerRow} seats</span>)}</div><div className="mt-4 flex gap-2"><Button onClick={applyProposal} className="bg-cyan-400 font-black text-slate-950 hover:bg-cyan-300">Apply editable proposal</Button><Button variant="outline" onClick={() => setProposal(null)}>Discard</Button></div></div> : null}
        </section> : null}

        {preview ? (
          <CustomerHallMap plan={previewPlan} selectedSeatIds={[]} onChange={() => {}} currency="BHD" locale="en" eventContext={{ title: "Dashboard customer preview", date: "Event date", time: "Event time", location: "Venue" }} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a151e]">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-transparent">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadBackground(file); }} />
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" onClick={addStage}><Square className="mr-2 h-4 w-4" />Add stage</Button>
                <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500" onClick={addSection}><Layers3 className="mr-2 h-4 w-4" />Add section</Button>
                <Button size="sm" variant="outline" className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:disabled:bg-white/5 dark:disabled:text-white/35" onClick={generateChairs} disabled={selection.section === null}><Armchair className="mr-2 h-4 w-4" />Add rows & chairs</Button>
                <Button size="sm" variant="ghost" className="text-cyan-700 hover:bg-slate-100 hover:text-slate-950 disabled:text-slate-400 dark:text-cyan-200 dark:hover:bg-white/10 dark:hover:text-white dark:disabled:text-white/30" disabled={uploading} onClick={() => fileRef.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : floorPlanUrl ? "Replace background" : "Background"}</Button>
                {floorPlanUrl ? <Button size="sm" variant="ghost" className="text-red-300" onClick={() => setFloorPlanUrl("")}>Remove background</Button> : null}
                <span className="mx-1 h-6 w-px bg-white/10" />
                <Button size="icon" variant="ghost" className="text-slate-900 hover:bg-slate-200 disabled:text-slate-300 dark:text-white dark:hover:bg-white/10 dark:disabled:text-white/25" onClick={undo} disabled={!undoStack.length}><Undo2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-slate-900 hover:bg-slate-200 disabled:text-slate-300 dark:text-white dark:hover:bg-white/10 dark:disabled:text-white/25" onClick={redo} disabled={!redoStack.length}><Redo2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="hover:bg-white/10 disabled:text-white/25" onClick={deleteSelection} disabled={selection.section === null && selection.stage === null}><Trash2 className="h-4 w-4 text-red-300" /></Button>
                <div className="relative z-50 ml-auto flex items-center gap-2"><button type="button" aria-label="Zoom out seating canvas" title="Zoom out" onClick={() => setZoom((value) => Math.max(.6, value - .1))} className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/50 bg-slate-950 text-lg font-black text-white hover:bg-cyan-700">−</button><span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span><button type="button" aria-label="Zoom in seating canvas" title="Zoom in" onClick={() => setZoom((value) => Math.min(2, value + .1))} className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/50 bg-slate-950 text-lg font-black text-white hover:bg-cyan-700">+</button><button type="button" aria-label="Fit seating canvas to view" title="Fit map to view" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="h-9 rounded-full border-2 border-white/40 bg-white px-3 text-xs font-black text-slate-950">Fit</button></div>
              </div>
              <div className="relative min-h-[760px] cursor-grab overflow-hidden bg-slate-100 active:cursor-grabbing dark:bg-slate-950" onPointerDown={(event) => { if ((event.target as HTMLElement).closest("[data-map-item]")) return; dragRef.current = { kind: "pan", client: { x: event.clientX, y: event.clientY }, pan: clone(pan) }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={movePointer} onPointerUp={() => { dragRef.current = null; }} onClick={() => setSelection(EMPTY_SELECTION)}>
                <div ref={canvasRef} className="absolute left-1/2 top-1/2 aspect-video w-[94%] -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-slate-300 bg-white shadow-2xl" style={{ transform: `translate(calc(-50% + ${pan.x}px),calc(-50% + ${pan.y}px)) scale(${zoom})`, backgroundImage: floorPlanUrl ? `url(${floorPlanUrl})` : "linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)", backgroundSize: floorPlanUrl ? "contain" : "24px 24px", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
                  {stages.map((stage, index) => <div data-map-item key={stage.id} onClick={(event) => { event.stopPropagation(); setSelection({ ...EMPTY_SELECTION, stage: index }); }} onPointerDown={(event) => beginMove("stage", index, event)} className={`absolute grid cursor-move place-items-center rounded-md border-2 text-xs font-black tracking-widest ${selection.stage === index ? "border-cyan-500 ring-2 ring-cyan-300" : "border-slate-500/40"}`} style={{ left: `${stage.x}%`, top: `${stage.y}%`, width: `${stage.width}%`, height: `${stage.height}%`, transform: "translate(-50%,-50%)", backgroundColor: stage.color, color: "white" }}>{stage.text}<button onPointerDown={(event) => beginMove("resize-stage", index, event)} className="absolute -bottom-2 -right-2 h-4 w-4 rounded bg-cyan-500" /></div>)}
                  {sections.map((section, sectionIndex) => { const density = getSeatDensity(section.rows); return <div data-map-item key={section.id} onClick={(event) => { event.stopPropagation(); setSelection({ ...EMPTY_SELECTION, section: sectionIndex }); }} onPointerDown={(event) => beginMove("section", sectionIndex, event)} className={`absolute cursor-move rounded-xl border-2 ${selection.section === sectionIndex ? "border-cyan-500 ring-2 ring-cyan-300/70" : "border-slate-400/60"}`} style={{ left: `${section.x}%`, top: `${section.y}%`, width: `${section.width}%`, height: `${section.height}%`, containerType: "size", transform: `translate(-50%,-50%) rotate(${section.rotation}deg)`, backgroundColor: `${section.color}38` }}>
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded-t bg-slate-900 px-2 py-1 text-[8px] font-black text-white">{section.name}</span>
                    {section.rows.flatMap((row, rowIndex) => row.seats.map((seat) => { const selected = selection.seats.includes(seat.id); return <button key={seat.id} data-seat-id={seat.id} aria-label={`${section.name}, row ${row.label}, seat ${seat.label}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setSelection((value) => ({ section: sectionIndex, row: rowIndex, stage: null, seats: event.shiftKey ? value.seats.includes(seat.id) ? value.seats.filter((id) => id !== seat.id) : [...value.seats, seat.id] : [seat.id] })); }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 hover:scale-150 ${selected ? "ring-2 ring-cyan-500 ring-offset-1" : ""}`} style={{ width: density.dotSize, height: density.dotSize, left: `${seat.x}%`, top: `${seat.y}%`, backgroundColor: seat.status === "blocked" || seat.sold || seat.held ? "#cbd5e1" : seat.color ?? row.color ?? section.color }} title={`${section.name} · ${row.label}-${seat.label}`} />; }))}
                    <button onPointerDown={(event) => beginMove("resize-section", sectionIndex, event)} className="absolute -bottom-2 -right-2 h-4 w-4 rounded bg-cyan-500" />
                  </div>; })}
                  {!sections.length && !stages.length ? <div className="absolute inset-0 grid place-items-center text-center text-slate-400"><div><Grid3X3 className="mx-auto h-12 w-12" /><p className="mt-3 font-black text-slate-600">Start with a blank hall</p><p className="mt-1 text-sm">Add a stage, then create your first seating section.</p></div></div> : null}
                </div>
              </div>
            </section>

            <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0b1822]">
              <div><p className="text-xs font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Inspector</p><p className="mt-1 text-xs text-slate-500 dark:text-white/40">Select an item on the canvas to edit it.</p></div>
              <div className="rounded-xl bg-white/[.04] px-3 py-2 text-xs text-white/55">{stages.length} stage · {sections.length} sections · {seatCount} chairs</div>
              {activeStage ? <div className="space-y-3"><p className="font-black">Stage</p><label className="block text-xs text-white/50">Label<Input className="mt-1" value={activeStage.text} onChange={(event) => setStages((items) => items.map((stage, index) => index === selection.stage ? { ...stage, text: event.target.value } : stage))} /></label><label className="block text-xs text-white/50">Colour<Input className="mt-1 h-10" type="color" value={activeStage.color} onChange={(event) => setStages((items) => items.map((stage, index) => index === selection.stage ? { ...stage, color: event.target.value } : stage))} /></label><div className="grid grid-cols-2 gap-2"><label className="text-xs text-white/50">Width<Input type="number" value={activeStage.width} onChange={(event) => setStages((items) => items.map((stage, index) => index === selection.stage ? { ...stage, width: Number(event.target.value) } : stage))} /></label><label className="text-xs text-white/50">Height<Input type="number" value={activeStage.height} onChange={(event) => setStages((items) => items.map((stage, index) => index === selection.stage ? { ...stage, height: Number(event.target.value) } : stage))} /></label></div></div> : null}
              {activeSection ? <div className="space-y-4"><div><p className="font-black">{selection.seats.length ? `${selection.seats.length} selected chairs` : selection.row !== null ? `Row ${activeSection.rows[selection.row]?.label}` : "Section"}</p><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelection((value) => ({ ...value, row: null, seats: activeSection.rows.flatMap((row) => row.seats.map((seat) => seat.id)) }))}>All chairs</Button>{activeSection.rows.map((row, rowIndex) => <Button key={row.id} size="sm" variant="outline" onClick={() => setSelection((value) => ({ ...value, row: rowIndex, seats: row.seats.map((seat) => seat.id) }))}>Row {row.label}</Button>)}</div></div>
                <label className="block text-xs text-white/50">Section name<Input className="mt-1" value={activeSection.name} onChange={(event) => setSections((items) => items.map((section, index) => index === selection.section ? { ...section, name: event.target.value } : section))} /></label>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs font-black uppercase tracking-wider">Generate chairs</p><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs text-white/50">Rows<Input type="number" min={1} max={30} value={rowCount} onChange={(event) => setRowCount(Number(event.target.value))} /></label><label className="text-xs text-white/50">Seats / row<Input type="number" min={1} max={50} value={seatsPerRow} onChange={(event) => setSeatsPerRow(Number(event.target.value))} /></label></div><Button className="mt-3 w-full" onClick={generateChairs}><Armchair className="mr-2 h-4 w-4" />Generate visible chairs</Button></div>
                <div className="rounded-xl border border-white/10 p-3"><p className="text-xs font-black uppercase tracking-wider">Pricing & colour</p><p className="mt-1 text-[10px] text-white/40">Applies to selected chairs, selected row, or the whole section.</p><label className="mt-3 block text-xs text-white/50">Price in BHD<Input type="number" min={0} step="0.5" value={batchPrice} onChange={(event) => setBatchPrice(event.target.value)} /></label><div className="mt-3 flex flex-wrap gap-2">{COLORS.map((color) => <button key={color} onClick={() => setBatchColor(color)} className={`h-8 w-8 rounded-full ${batchColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : ""}`} style={{ backgroundColor: color }} />)}</div><Button className="mt-3 w-full bg-violet-500 hover:bg-violet-400" onClick={applyPricing}>Apply price & colour</Button></div>
                {selection.seats.length === 1 ? <div className="rounded-xl border border-white/10 p-3"><p className="text-xs font-black uppercase tracking-wider">Individual chair</p>{(() => { const row = activeSection.rows.find((item) => item.seats.some((seat) => seat.id === selection.seats[0])); const seat = row?.seats.find((item) => item.id === selection.seats[0]); if (!row || !seat) return null; const updateSeat = (change: Partial<Seat>) => setSections((items) => items.map((section, si) => si !== selection.section ? section : { ...section, rows: section.rows.map((candidate) => candidate.id !== row.id ? candidate : { ...candidate, seats: candidate.seats.map((candidateSeat) => candidateSeat.id === seat.id ? { ...candidateSeat, ...change } : candidateSeat) }) })); return <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs text-white/50">Label<Input value={seat.label} onChange={(event) => updateSeat({ label: event.target.value })} /></label><label className="text-xs text-white/50">Status<select className="mt-2 h-10 w-full rounded-md bg-slate-900 px-2" value={seat.status} onChange={(event) => updateSeat({ status: event.target.value as Seat["status"] })}><option value="available">Available</option><option value="blocked">Blocked</option></select></label><label className="text-xs text-white/50">X position<Input type="number" min={0} max={100} value={seat.x} onChange={(event) => updateSeat({ x: snap(Number(event.target.value)) })} /></label><label className="text-xs text-white/50">Y position<Input type="number" min={0} max={100} value={seat.y} onChange={(event) => updateSeat({ y: snap(Number(event.target.value)) })} /></label></div>; })()}</div> : null}
              </div> : !activeStage ? <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-white/10 text-center text-white/30"><div><MousePointer2 className="mx-auto h-8 w-8" /><p className="mt-2 text-sm">Nothing selected</p></div></div> : null}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

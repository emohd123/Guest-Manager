"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  GripVertical,
  Clock,
  MapPin,
  User,
  CalendarDays,
  Mail,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  FileText,
  Pencil,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  speaker?: string;
}

export interface AgendaSettings {
  items: AgendaItem[];
  attachToEmail: boolean;
  agendaTitle?: string;
  /** URL of an already-uploaded agenda PDF (overrides the designed schedule) */
  uploadedPdfUrl?: string;
  /** "design" = build schedule in-app | "upload" = use your own PDF */
  mode?: "design" | "upload";
}

interface AgendaEditorProps {
  settings: AgendaSettings;
  onChange: (settings: AgendaSettings) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// ── Single session row ───────────────────────────────────────────────────────
function AgendaItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: AgendaItem;
  onUpdate: (patch: Partial<AgendaItem>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <GripVertical className="h-4 w-4 text-zinc-300 shrink-0 cursor-grab" />

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0 w-24">
          <Clock className="h-3.5 w-3.5" />
          <Input
            type="time"
            value={item.time}
            onChange={(e) => onUpdate({ time: e.target.value })}
            className="border-none bg-transparent p-0 h-auto text-xs font-mono focus-visible:ring-0 w-full"
          />
        </div>

        <Input
          placeholder="Session title…"
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="flex-1 border-none bg-transparent p-0 h-auto text-sm font-semibold focus-visible:ring-0 placeholder:font-normal placeholder:text-zinc-300"
        />

        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-zinc-300 hover:text-red-500 transition-colors p-1 rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-zinc-50 dark:border-zinc-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <User className="h-3 w-3" /> Speaker / Presenter
              </Label>
              <Input
                placeholder="e.g. Dr. Ahmed Al-Rashad"
                value={item.speaker || ""}
                onChange={(e) => onUpdate({ speaker: e.target.value })}
                className="h-9 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Location / Room
              </Label>
              <Input
                placeholder="e.g. Hall A, Room 101"
                value={item.location || ""}
                onChange={(e) => onUpdate({ location: e.target.value })}
                className="h-9 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-400">Description (optional)</Label>
            <Textarea
              placeholder="Brief description of this session…"
              value={item.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="min-h-[72px] rounded-xl text-sm resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── PDF Upload area ──────────────────────────────────────────────────────────
function PdfUpload({
  value,
  onChange,
  onRemove,
}: {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20 MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.pdf`;
      const filePath = `agendas/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("events")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });

      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("events").getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (err) {
      console.error("Agenda PDF upload failed:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (value) {
    // Show uploaded file info
    const fileName = value.split("/").pop()?.split("?")[0] ?? "agenda.pdf";
    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{fileName}</p>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline font-medium"
          >
            Preview uploaded PDF ↗
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded-xl"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 transition-all duration-300 cursor-pointer min-h-[180px] group",
          isUploading
            ? "opacity-70 cursor-wait"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:border-primary/50"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-sm font-bold text-zinc-500 animate-pulse">Uploading PDF…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-black text-zinc-950 dark:text-white mb-1">
              Click to upload your agenda PDF
            </p>
            <p className="text-xs text-zinc-500 font-medium max-w-[220px] leading-relaxed">
              Upload any existing agenda document in PDF format. Max 20 MB.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium px-1">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleUpload}
        disabled={isUploading}
      />
    </div>
  );
}

// ── Main AgendaEditor ────────────────────────────────────────────────────────
export function AgendaEditor({ settings, onChange }: AgendaEditorProps) {
  const update = (patch: Partial<AgendaSettings>) =>
    onChange({ ...settings, ...patch });

  const mode = settings.mode ?? "design";

  const addItem = () => {
    const newItem: AgendaItem = { id: generateId(), time: "", title: "" };
    update({ items: [...(settings.items ?? []), newItem] });
  };

  const updateItem = (id: string, patch: Partial<AgendaItem>) => {
    update({
      items: (settings.items ?? []).map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const removeItem = (id: string) => {
    update({ items: (settings.items ?? []).filter((item) => item.id !== id) });
  };

  const items = settings.items ?? [];

  return (
    <div className="space-y-8">

      {/* ── Mode Selector ── */}
      <div className="space-y-3">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Agenda Source
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {/* Design mode */}
          <button
            type="button"
            onClick={() => update({ mode: "design" })}
            className={cn(
              "relative flex flex-col items-start gap-2 p-5 rounded-2xl border-2 text-left transition-all",
              mode === "design"
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300"
            )}
          >
            {mode === "design" && (
              <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
            <Pencil className={cn("h-5 w-5", mode === "design" ? "text-primary" : "text-zinc-400")} />
            <div>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">Design Schedule</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Build your agenda inside the app — sessions, speakers, times.
              </p>
            </div>
          </button>

          {/* Upload mode */}
          <button
            type="button"
            onClick={() => update({ mode: "upload" })}
            className={cn(
              "relative flex flex-col items-start gap-2 p-5 rounded-2xl border-2 text-left transition-all",
              mode === "upload"
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300"
            )}
          >
            {mode === "upload" && (
              <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
            <UploadCloud className={cn("h-5 w-5", mode === "upload" ? "text-primary" : "text-zinc-400")} />
            <div>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">Upload My Agenda</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Already have a PDF? Upload it directly and skip the designer.
              </p>
            </div>
          </button>
        </div>
      </div>

      <Separator />

      {/* ── Email attach toggle ── */}
      <div
        className={cn(
          "flex items-start gap-4 p-5 rounded-2xl border-2 transition-colors",
          settings.attachToEmail
            ? "border-primary/30 bg-primary/5"
            : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
        )}
      >
        <div className="mt-0.5">
          <Switch
            id="agenda-attach"
            checked={settings.attachToEmail}
            onCheckedChange={(checked) => update({ attachToEmail: checked })}
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="agenda-attach"
            className="text-sm font-bold cursor-pointer select-none flex items-center gap-2"
          >
            <Mail className="h-4 w-4 text-primary" />
            Attach Agenda to Ticket Emails
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            {settings.attachToEmail
              ? "The agenda PDF will be automatically attached to every ticket email sent to attendees."
              : "Agenda is saved but will NOT be attached to outgoing emails. Toggle on to include it."}
          </p>
        </div>
        <div
          className={cn(
            "text-xs font-black px-3 py-1 rounded-full",
            settings.attachToEmail
              ? "bg-primary/10 text-primary"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
          )}
        >
          {settings.attachToEmail ? "ON" : "OFF"}
        </div>
      </div>

      <Separator />

      {/* ── Upload mode content ── */}
      {mode === "upload" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Agenda PDF File
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload your finalized agenda as a PDF. This file will be sent as an attachment.
            </p>
          </div>
          <PdfUpload
            value={settings.uploadedPdfUrl}
            onChange={(url) => update({ uploadedPdfUrl: url })}
            onRemove={() => update({ uploadedPdfUrl: "" })}
          />
          {settings.uploadedPdfUrl && (
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40">
              <p className="text-xs text-green-700 dark:text-green-300">
                <strong>Ready!</strong> This PDF will be attached to ticket emails when the toggle above is ON.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Design mode content ── */}
      {mode === "design" && (
        <>
          {/* Agenda title */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Agenda Document Title
            </Label>
            <Input
              placeholder="e.g. ASU Graduation Ceremony – Official Agenda"
              value={settings.agendaTitle || ""}
              onChange={(e) => update({ agendaTitle: e.target.value })}
              className="rounded-2xl h-12 text-sm font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              This title will appear at the top of the generated agenda PDF.
            </p>
          </div>

          {/* Sessions list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Schedule ({items.length} session{items.length !== 1 ? "s" : ""})
              </Label>
              <Button
                type="button"
                size="sm"
                onClick={addItem}
                className="rounded-xl gap-1.5 h-8 px-4 font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Session
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <CalendarDays className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-400">No agenda items yet</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Click &quot;Add Session&quot; to start building your event schedule.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    onUpdate={(patch) => updateItem(item.id, patch)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Tip:</strong> Sessions are listed in the order added. Enter times
                in chronological order. Click any row to expand and add speaker, location,
                and description details.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

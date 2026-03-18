"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Mail, Ticket, ClipboardList, ShoppingCart, X, Download, Loader2 } from "lucide-react";
import { TicketPreview, type TicketDesignSettings } from "@/components/tickets/TicketPreview";

export interface EmailDesign {
  headerImageUrl?: string;
  senderName?: string;
  replyTo?: string;
  bodyHtml?: string;
}

export interface EmailDesignState {
  ticket_sent?: EmailDesign;
  rsvp?: EmailDesign;
  order_confirmation?: EmailDesign;
  abandoned_order?: EmailDesign;
}

interface EmailDesignEditorProps {
  designs: EmailDesignState;
  onChange: (designs: EmailDesignState) => void;
  eventName?: string;
  ticketDesign?: TicketDesignSettings; // passed from parent to render real preview
  venue?: string;
  startDate?: string;
}

const EMAIL_TYPES = [
  { key: "ticket_sent"        as const, label: "Ticket Sent",        icon: Ticket,       description: "Sent when a ticket is confirmed and issued to the attendee." },
  { key: "rsvp"               as const, label: "RSVP",               icon: ClipboardList, description: "Sent when an attendee RSVPs to a free event." },
  { key: "order_confirmation" as const, label: "Order Confirmation",  icon: ShoppingCart, description: "Sent immediately after a successful payment." },
  { key: "abandoned_order"    as const, label: "Abandoned Order",     icon: Mail,         description: "Sent as a reminder when an order is started but not completed." },
];

const DEFAULT_BODY = `Kindly read the instructions carefully:

• Please present the invitation ticket to the check-in point at the venue to avoid any delay, as the tickets are valid for one-time use only.
• Kindly follow the instructions by the ushers during the ceremony.

الرجاء قراءة التعليمات التالية بعناية:

• الرجاء إبراز بطاقة الدعوة عند بوابة الدخول لتجنب التأخير، علماً بأن البطاقة صالحة للاستخدام مرة واحدة فقط.
• الرجاء اتباع تعليمات المنظمين أثناء الحفل.`;

// ── Ticket view modal ──────────────────────────────────────────────────────
function TicketModal({
  open,
  onClose,
  ticketDesign,
  eventName,
  venue,
  startDate,
}: {
  open: boolean;
  onClose: () => void;
  ticketDesign?: TicketDesignSettings;
  eventName?: string;
  venue?: string;
  startDate?: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPdf = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch("/api/design/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: ticketDesign ?? {}, eventName, venue, startDate }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ticket-design-preview.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Card */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-900 px-5 py-3 flex items-center justify-between">
          <span className="text-white text-sm font-bold flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" /> Ticket Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
              ) : (
                <><Download className="h-3 w-3" /> Download PDF</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Ticket */}
        <div className="p-4 bg-zinc-950">
          <TicketPreview
            design={ticketDesign ?? {}}
            eventName={eventName}
            venue={venue}
            startDate={startDate}
          />
          <p className="text-xs text-zinc-500 text-center mt-3">
            Preview uses sample data — real ticket will show attendee information.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Single email type editor ───────────────────────────────────────────────
function SingleEmailEditor({
  design,
  onChange,
  ticketDesign,
  eventName,
  venue,
  startDate,
}: {
  design: EmailDesign;
  onChange: (d: EmailDesign) => void;
  ticketDesign?: TicketDesignSettings;
  eventName?: string;
  venue?: string;
  startDate?: string;
}) {
  const update = (patch: Partial<EmailDesign>) => onChange({ ...design, ...patch });
  const [previewVisible, setPreviewVisible] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPdf = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch("/api/design/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design: ticketDesign ?? {}, eventName, venue, startDate }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ticket-design-preview.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Sender info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sender Name</Label>
          <Input
            placeholder="Your Organization Name"
            value={design.senderName || ""}
            onChange={(e) => update({ senderName: e.target.value })}
            className="rounded-xl h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Reply-To Email</Label>
          <Input
            type="email"
            placeholder="support@yourorg.com"
            value={design.replyTo || ""}
            onChange={(e) => update({ replyTo: e.target.value })}
            className="rounded-xl h-11"
          />
        </div>
      </div>

      <Separator />

      {/* Header image */}
      <div className="space-y-3">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Header Banner Image</Label>
        <p className="text-xs text-muted-foreground">Upload a branded banner that appears at the top of the email (recommended: 600px wide).</p>
        <ImageUpload
          label=""
          description=""
          value={design.headerImageUrl || ""}
          onChange={(url) => update({ headerImageUrl: url })}
          onRemove={() => update({ headerImageUrl: "" })}
          aspectRatio="video"
        />
      </div>

      <Separator />

      {/* Body */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Body</Label>
          <button
            type="button"
            onClick={() => setPreviewVisible(!previewVisible)}
            className="text-xs text-primary font-bold hover:underline"
          >
            {previewVisible ? "Hide Preview" : "Show Preview"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Write your email body. Supports bilingual content (English + Arabic). You can use HTML tags for formatting.
          The ticket QR code and attendee details are added automatically below your body text.
        </p>
        <Textarea
          value={design.bodyHtml || DEFAULT_BODY}
          onChange={(e) => update({ bodyHtml: e.target.value })}
          className="font-mono text-xs min-h-[220px] rounded-[1.5rem] bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 p-5"
          placeholder={DEFAULT_BODY}
        />
      </div>

      {/* Inline preview */}
      {previewVisible && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-xl">
          {/* Email bar */}
          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-mono text-zinc-500 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" /> Email Preview
          </div>
          <div className="bg-[#f6f9fc] p-6 space-y-4">
            {/* Header image */}
            {design.headerImageUrl && (
              <img
                src={design.headerImageUrl}
                alt="Header"
                className="w-full rounded-lg object-cover max-h-48"
              />
            )}

            {/* Greeting */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
              <h2 className="text-lg font-black text-zinc-900">Here is your ticket! 🎟️</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Hi <strong>John Doe</strong>, thank you for registering for{" "}
                <strong>{eventName ?? "Sample Event"}</strong>. Please find your ticket details below.
              </p>

              {/* Body text */}
              <div
                className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed border-t pt-3 border-zinc-100"
              >
                {design.bodyHtml || DEFAULT_BODY}
              </div>

              <hr className="border-zinc-100" />

              {/* Ticket card */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ticket Info (auto-generated)</p>
                <div className="flex gap-6 text-xs text-zinc-600">
                  <div><span className="font-bold block text-zinc-800">Event</span>{eventName ?? "Sample Event"}</div>
                  <div><span className="font-bold block text-zinc-800">Attendee</span>John Doe</div>
                  <div><span className="font-bold block text-zinc-800">Ticket</span>GA</div>
                </div>

                {/* View Ticket + Download PDF buttons */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTicketModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                  >
                    <Ticket className="h-3 w-3" />
                    View Ticket
                  </button>
                  <button
                    type="button"
                    onClick={downloadPdf}
                    disabled={isDownloading}
                    className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                    ) : (
                      <><Download className="h-3 w-3" /> Download PDF</>
                    )}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <p className="text-[11px] text-zinc-400 text-center pt-2 border-t border-zinc-100">
                This email was sent by {design.senderName || "Events Hub"}. Tickets are for one-time use only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full ticket modal */}
      <TicketModal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        ticketDesign={ticketDesign}
        eventName={eventName}
        venue={venue}
        startDate={startDate}
      />
    </div>
  );
}

// ── Main editor component ─────────────────────────────────────────────────
export function EmailDesignEditor({ designs, onChange, eventName, ticketDesign, venue, startDate }: EmailDesignEditorProps) {
  const update = (type: keyof EmailDesignState, design: EmailDesign) => {
    onChange({ ...designs, [type]: design });
  };

  return (
    <Tabs defaultValue="ticket_sent" className="space-y-6">
      <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl">
        {EMAIL_TYPES.map(({ key, label, icon: Icon }) => (
          <TabsTrigger
            key={key}
            value={key}
            className="rounded-xl text-xs font-bold py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow gap-1.5"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {EMAIL_TYPES.map(({ key, label, description }) => (
        <TabsContent key={key} value={key} className="space-y-4 mt-2">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <p className="text-xs text-blue-700 dark:text-blue-300"><strong>{label}:</strong> {description}</p>
          </div>
          <SingleEmailEditor
            design={designs[key] || {}}
            onChange={(d) => update(key, d)}
            ticketDesign={ticketDesign}
            eventName={eventName}
            venue={venue}
            startDate={startDate}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

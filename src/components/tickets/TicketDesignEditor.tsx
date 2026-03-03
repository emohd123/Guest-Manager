"use client";

import { ImageUpload } from "@/components/shared/ImageUpload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketPreview, TicketDesignSettings } from "@/components/tickets/TicketPreview";
import { Separator } from "@/components/ui/separator";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface TicketDesignEditorProps {
  design: TicketDesignSettings;
  onChange: (design: TicketDesignSettings) => void;
  eventName?: string;
  venue?: string;
  startDate?: string;
  /** The unique visitor code for this event, shown below the field toggles */
  visitorCode?: string;
  /** App download URL — rendered as a QR code next to the visitor code in the preview */
  appDownloadUrl?: string;
}

const FIELD_TOGGLES: { key: keyof NonNullable<TicketDesignSettings["visibleFields"]>; label: string }[] = [
  { key: "eventName",    label: "Event Name" },
  { key: "ticketType",   label: "Ticket Type" },
  { key: "venue",        label: "Venue" },
  { key: "startDate",    label: "Start Date" },
  { key: "attendeeName", label: "Attendee Name" },
  { key: "barcode",      label: "Barcode / QR Code" },
  { key: "price",        label: "Price" },
  { key: "tax",          label: "Tax" },
  { key: "orderNumber",  label: "Order Number" },
  { key: "productName",  label: "Product Name" },
  { key: "email",        label: "Email" },
];

const DEFAULT_VISIBLE = {
  eventName: true,
  ticketType: true,
  venue: true,
  startDate: true,
  attendeeName: true,
  barcode: true,
  price: false,
  tax: false,
  orderNumber: false,
  productName: false,
  email: false,
};

export function TicketDesignEditor({ design, onChange, eventName, venue, startDate, visitorCode, appDownloadUrl }: TicketDesignEditorProps) {
  const [copied, setCopied] = useState(false);
  // Always merge DEFAULT_VISIBLE with saved settings so no field is accidentally undefined
  const visible = { ...DEFAULT_VISIBLE, ...(design.visibleFields ?? {}) };
  const showVisitorCode = (design as { showVisitorCode?: boolean }).showVisitorCode ?? true;

  const update = (patch: Partial<TicketDesignSettings>) => onChange({ ...design, ...patch });

  const toggleField = (key: keyof typeof DEFAULT_VISIBLE, value: boolean) => {
    onChange({ ...design, visibleFields: { ...visible, [key]: value } });
  };

  function copyCode() {
    if (!visitorCode) return;
    navigator.clipboard.writeText(visitorCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Left: Controls */}
      <div className="space-y-8">

        {/* Background Image */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Background Template</h3>
          <p className="text-xs text-muted-foreground mb-4">Upload a custom ticket background image (PNG or JPG, 8.5&quot; × 3.5&quot; landscape recommended).</p>
          <ImageUpload
            label=""
            description=""
            value={design.backgroundImageUrl || ""}
            onChange={(url) => update({ backgroundImageUrl: url })}
            onRemove={() => update({ backgroundImageUrl: "" })}
            aspectRatio="video"
          />
        </div>

        <Separator />

        {/* Colors */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Label Color</Label>
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <input
                type="color"
                value={design.labelColor || "#dec245"}
                onChange={(e) => update({ labelColor: e.target.value })}
                className="h-10 w-10 rounded-xl border-none cursor-pointer bg-transparent"
              />
              <Input
                value={design.labelColor || "#dec245"}
                onChange={(e) => update({ labelColor: e.target.value })}
                className="border-none bg-transparent font-mono text-sm focus-visible:ring-0 h-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Text Color</Label>
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <input
                type="color"
                value={design.textColor || "#000000"}
                onChange={(e) => update({ textColor: e.target.value })}
                className="h-10 w-10 rounded-xl border-none cursor-pointer bg-transparent"
              />
              <Input
                value={design.textColor || "#000000"}
                onChange={(e) => update({ textColor: e.target.value })}
                className="border-none bg-transparent font-mono text-sm focus-visible:ring-0 h-8"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Date Format */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date Format</Label>
          <Select value={design.dateFormat || "datetime"} onValueChange={(v) => update({ dateFormat: v })}>
            <SelectTrigger className="rounded-xl h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="datetime">Date and time</SelectItem>
              <SelectItem value="date">Date only</SelectItem>
              <SelectItem value="time">Time only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Field Toggles */}
        <div className="space-y-3">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Show on Ticket</Label>
          <div className="space-y-2">
            {FIELD_TOGGLES.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
              >
                <span className="text-sm font-medium">{label}</span>
                <Switch
                  checked={visible[key] ?? false}
                  onCheckedChange={(v) => toggleField(key, v)}
                />
              </div>
            ))}
            {/* Visitor Code toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
              <div>
                <span className="text-sm font-medium">Event Visitor Code</span>
                <p className="text-xs text-muted-foreground mt-0.5">Shows the unique code on the ticket so attendees can link the event in the Visitor Portal app</p>
              </div>
              <Switch
                checked={showVisitorCode}
                onCheckedChange={(v) => onChange({ ...design, showVisitorCode: v } as TicketDesignSettings)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Visitor Code Display */}
        {visitorCode && (
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Event Visitor Code</Label>
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-5 py-4">
              <div className="flex-1">
                <p className="font-black text-2xl tracking-widest font-mono text-indigo-700 dark:text-indigo-300">{visitorCode}</p>
                <p className="text-xs text-muted-foreground mt-1">Send this code to attendees so they can connect in the Visitor Portal app</p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Live Preview */}
      <div className="sticky top-4 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preview</h3>
        <TicketPreview
          design={design}
          onDesignChange={update}
          eventName={eventName}
          venue={venue}
          startDate={startDate}
          visitorCode={showVisitorCode ? visitorCode : undefined}
          appDownloadUrl={showVisitorCode && visitorCode ? (appDownloadUrl ?? "http://localhost:8081") : undefined}
        />
        <p className="text-xs text-muted-foreground text-center">
          Preview uses sample data — real ticket will show attendee information.
        </p>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import QRCode from "qrcode";
import { useEffect, useState, useRef, useCallback } from "react";
import { Move, ZoomIn, ZoomOut, RotateCcw, Download, Loader2 } from "lucide-react";

export interface TicketDesignSettings {
  backgroundImageUrl?: string;
  labelColor?: string;
  textColor?: string;
  dateFormat?: string;
  // Image placement — offset from center in % of container, scale multiplier
  imagePositionX?: number; // default 0 (centered)
  imagePositionY?: number; // default 0 (centered)
  imageScale?: number;     // default 1.0
  visibleFields?: {
    eventName?: boolean;
    ticketType?: boolean;
    venue?: boolean;
    startDate?: boolean;
    attendeeName?: boolean;
    barcode?: boolean;
    price?: boolean;
    tax?: boolean;
    orderNumber?: boolean;
    productName?: boolean;
    email?: boolean;
  };
}

interface TicketPreviewProps {
  design: TicketDesignSettings;
  onDesignChange?: (patch: Partial<TicketDesignSettings>) => void;
  eventName?: string;
  ticketType?: string;
  venue?: string;
  startDate?: string;
  attendeeName?: string;
  price?: string;
  orderNumber?: string;
}

export function TicketPreview({
  design,
  onDesignChange,
  eventName = "Test Event",
  ticketType = "GA",
  venue = "Gulf Hotel - ALDANA Hall",
  startDate = "February 23, 2026 14:00",
  attendeeName = "John Doe",
  price = "Free",
  orderNumber = "1000000001",
}: TicketPreviewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  const labelColor = design.labelColor || "#dec245";
  const textColor = design.textColor || "#000000";
  // offsetX/Y are % of container width/height (pan offset from center)
  const offsetX = design.imagePositionX ?? 0;
  const offsetY = design.imagePositionY ?? 0;
  const scale = design.imageScale ?? 1;

  // Merge saved settings with per-field defaults so missing keys still show correctly
  const visible = {
    eventName:    design.visibleFields?.eventName    ?? true,
    ticketType:   design.visibleFields?.ticketType   ?? true,
    venue:        design.visibleFields?.venue        ?? true,
    startDate:    design.visibleFields?.startDate    ?? true,
    attendeeName: design.visibleFields?.attendeeName ?? true,
    barcode:      design.visibleFields?.barcode      ?? true,
    price:        design.visibleFields?.price        ?? false,
    tax:          design.visibleFields?.tax          ?? false,
    orderNumber:  design.visibleFields?.orderNumber  ?? false,
    productName:  design.visibleFields?.productName  ?? false,
    email:        design.visibleFields?.email        ?? false,
  };

  const formattedDate = (() => {
    if (!startDate) return "";
    try {
      const d = new Date(startDate);
      const fmt = design.dateFormat ?? "datetime";
      if (fmt === "date") return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      if (fmt === "time") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      return (
        d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) +
        "\n" +
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return startDate;
    }
  })();

  useEffect(() => {
    QRCode.toDataURL(orderNumber, { width: 100, margin: 1 }).then(setQrDataUrl).catch(() => {});
  }, [orderNumber]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onDesignChange || !design.backgroundImageUrl) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { mx: e.clientX, my: e.clientY, ox: offsetX, oy: offsetY };
    },
    [onDesignChange, design.backgroundImageUrl, offsetX, offsetY]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStart.current || !onDesignChange) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // convert pixel delta → % of container
      const dx = ((e.clientX - dragStart.current.mx) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.my) / rect.height) * 100;
      onDesignChange({
        imagePositionX: dragStart.current.ox + dx,
        imagePositionY: dragStart.current.oy + dy,
      });
    },
    [isDragging, onDesignChange]
  );

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!onDesignChange || !design.backgroundImageUrl) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      onDesignChange({ imageScale: Math.min(4, Math.max(0.2, scale + delta)) });
    },
    [onDesignChange, design.backgroundImageUrl, scale]
  );

  // ── Download PDF ───────────────────────────────────────────────────────────
  const downloadPdf = useCallback(async () => {
    setIsDownloading(true);
    try {
      const res = await fetch("/api/design/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design }),
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
  }, [design]);

  const isEditable = !!onDesignChange && !!design.backgroundImageUrl;

  return (
    <div className="space-y-3">
      {/* ── Ticket card ───────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-2xl overflow-hidden shadow-2xl select-none ${isEditable ? "cursor-move" : ""}`}
        style={{ minHeight: "340px", background: "#1a2340", color: textColor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onWheel={onWheel}
      >
        {/* Background image — uses translate+scale so drag/zoom feel natural */}
        {design.backgroundImageUrl ? (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={design.backgroundImageUrl}
              alt=""
              draggable={false}
              className="absolute pointer-events-none"
              style={{
                // Center the image then apply pan offset + scale
                top: "50%",
                left: "50%",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: `translate(calc(-50% + ${offsetX}%), calc(-50% + ${offsetY}%)) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.05s",
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-slate-800 to-blue-950" />
        )}

        {/* Subtle overlay for readability */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Edit hint */}
        {isEditable && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1.5 rounded-full pointer-events-none select-none">
            <Move className="h-3 w-3" />
            Drag · Scroll to zoom
          </div>
        )}

        {/* Ticket content */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex-1 min-h-[160px]" />

          {/* Bottom info strip */}
          <div className="bg-white/95 backdrop-blur-sm p-5 flex items-start gap-6">
            <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-3">
              {visible.eventName && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: labelColor }}>EVENT</div>
                  <div className="text-xs font-bold font-mono leading-tight mt-0.5 text-zinc-900">{eventName}</div>
                </div>
              )}
              {visible.startDate && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: labelColor }}>DATE</div>
                  <div className="text-xs font-bold font-mono leading-tight mt-0.5 text-zinc-900 whitespace-pre-line">{formattedDate}</div>
                </div>
              )}
              {visible.ticketType && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: labelColor }}>TICKET TYPE</div>
                  <div className="text-xs font-bold font-mono leading-tight mt-0.5 text-zinc-900">{ticketType}</div>
                </div>
              )}
              {visible.venue && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: labelColor }}>VENUE</div>
                  <div className="text-xs font-bold font-mono leading-tight mt-0.5 text-zinc-900">{venue}</div>
                </div>
              )}
              {visible.attendeeName && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: labelColor }}>ATTENDEE</div>
                  <div className="text-xs font-bold font-mono leading-tight mt-0.5 text-zinc-900">{attendeeName}</div>
                </div>
              )}
              {visible.price && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: labelColor }}>PRICE</div>
                  <div className="text-xs font-bold font-mono leading-tight mt-0.5 text-zinc-900">{price}</div>
                </div>
              )}
              {visible.orderNumber && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: labelColor }}>ORDER</div>
                  <div className="text-xs font-bold font-mono leading-tight mt-0.5 text-zinc-900">#{orderNumber}</div>
                </div>
              )}
            </div>

            {visible.barcode && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-20 h-20" />
                ) : (
                  <div className="w-20 h-20 bg-zinc-200 animate-pulse rounded" />
                )}
                <div className="text-[7px] font-mono text-zinc-500 tracking-[0.05em]">{orderNumber}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Zoom / reset controls (only in edit mode with image) ─────────── */}
      {isEditable && (
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3">
          <button
            type="button"
            onClick={() => onDesignChange?.({ imageScale: Math.max(0.2, scale - 0.1) })}
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-muted-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={20}
            max={400}
            step={5}
            value={Math.round(scale * 100)}
            onChange={(e) => onDesignChange?.({ imageScale: Number(e.target.value) / 100 })}
            className="flex-1 h-1.5 accent-primary cursor-pointer"
          />
          <button
            type="button"
            onClick={() => onDesignChange?.({ imageScale: Math.min(4, scale + 0.1) })}
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-muted-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-mono text-muted-foreground w-12 text-right shrink-0">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onDesignChange?.({ imagePositionX: 0, imagePositionY: 0, imageScale: 1 })}
            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground transition-colors ml-1"
            title="Reset position & zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {/* ── Download PDF button (always shown in edit mode) ────────────── */}
      {isEditable && (
        <button
          type="button"
          onClick={downloadPdf}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating PDF…</>
          ) : (
            <><Download className="h-4 w-4" /> Download Sample PDF</>
          )}
        </button>
      )}
    </div>
  );
}

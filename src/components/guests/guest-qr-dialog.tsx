"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, QrCode } from "lucide-react";
import { toast } from "sonner";

type GuestForQR = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  guestType: string | null;
  tableNumber: string | null;
};

interface GuestQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: GuestForQR | null;
  eventName?: string;
}

export function GuestQrDialog({
  open,
  onOpenChange,
  guest,
  eventName,
}: GuestQrDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && guest) {
      QRCode.toDataURL(guest.id, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      }).then(setQrDataUrl).catch(() => {
        toast.error("Failed to generate QR code");
      });
    }
  }, [open, guest]);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl || !guest) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    const name = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim();
    link.download = `qr-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
    toast.success("QR code downloaded");
  }, [qrDataUrl, guest]);

  const handlePrint = useCallback(() => {
    if (!qrDataUrl || !guest) return;

    const name = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim();
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      toast.error("Please allow popups to print badges");
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Badge - ${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .badge { width: 3.5in; padding: 24px; text-align: center; border: 2px dashed #ccc; border-radius: 12px; }
    .badge h2 { font-size: 22px; margin-bottom: 4px; }
    .badge .type { font-size: 14px; color: #666; margin-bottom: 16px; display: inline-block; background: #f1f5f9; padding: 2px 12px; border-radius: 9999px; }
    .badge img { width: 200px; height: 200px; margin: 0 auto; display: block; }
    .badge .table { font-size: 14px; color: #666; margin-top: 12px; }
    .badge .event { font-size: 12px; color: #999; margin-top: 8px; }
    @media print { .badge { border: 1px solid #eee; } }
  </style>
</head>
<body>
  <div class="badge">
    <h2>${name}</h2>
    ${guest.guestType ? `<span class="type">${guest.guestType}</span>` : ""}
    <img src="${qrDataUrl}" alt="QR Code" />
    ${guest.tableNumber ? `<p class="table">Table ${guest.tableNumber}</p>` : ""}
    ${eventName ? `<p class="event">${eventName}</p>` : ""}
  </div>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [qrDataUrl, guest, eventName]);

  if (!guest) return null;

  const guestName = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> Guest QR Code
          </DialogTitle>
          <DialogDescription>
            Scan this QR code at check-in to instantly verify this guest.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {/* Guest info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">{guestName}</h3>
            <div className="mt-1 flex items-center justify-center gap-2">
              {guest.guestType && (
                <Badge variant="secondary">{guest.guestType}</Badge>
              )}
              {guest.tableNumber && (
                <Badge variant="outline">Table {guest.tableNumber}</Badge>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="rounded-lg border bg-white p-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${guestName}`}
                className="h-[200px] w-[200px]"
              />
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center">
                <QrCode className="h-12 w-12 animate-pulse text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Guest ID (small text) */}
          <p className="text-center font-mono text-xs text-muted-foreground">
            {guest.id}
          </p>

          {/* Actions */}
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={!qrDataUrl}
            >
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handlePrint}
              disabled={!qrDataUrl}
            >
              <Printer className="h-4 w-4" /> Print Badge
            </Button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

interface BulkQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: GuestForQR[];
  eventName?: string;
}

export function BulkQrPrintDialog({
  open,
  onOpenChange,
  guests,
  eventName,
}: BulkQrDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePrintAll = useCallback(async () => {
    if (guests.length === 0) return;
    setGenerating(true);
    setProgress(0);

    try {
      const badges: { name: string; type: string | null; table: string | null; qr: string }[] = [];

      for (let i = 0; i < guests.length; i++) {
        const g = guests[i];
        const qr = await QRCode.toDataURL(g.id, {
          width: 200,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        badges.push({
          name: `${g.firstName ?? ""} ${g.lastName ?? ""}`.trim(),
          type: g.guestType,
          table: g.tableNumber,
          qr,
        });
        setProgress(Math.round(((i + 1) / guests.length) * 100));
      }

      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        toast.error("Please allow popups to print badges");
        setGenerating(false);
        return;
      }

      const badgeHtml = badges
        .map(
          (b) => `
        <div class="badge">
          <h3>${b.name}</h3>
          ${b.type ? `<span class="type">${b.type}</span>` : ""}
          <img src="${b.qr}" alt="QR" />
          ${b.table ? `<p class="table">Table ${b.table}</p>` : ""}
          ${eventName ? `<p class="event">${eventName}</p>` : ""}
        </div>`
        )
        .join("");

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Guest Badges</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 16px; }
    .badge { padding: 16px; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid; }
    .badge h3 { font-size: 16px; margin-bottom: 4px; }
    .badge .type { font-size: 11px; color: #666; background: #f1f5f9; padding: 1px 8px; border-radius: 9999px; display: inline-block; margin-bottom: 8px; }
    .badge img { width: 140px; height: 140px; margin: 0 auto; display: block; }
    .badge .table { font-size: 12px; color: #666; margin-top: 8px; }
    .badge .event { font-size: 10px; color: #999; margin-top: 4px; }
    @media print { .grid { gap: 8px; padding: 8px; } }
  </style>
</head>
<body>
  <div class="grid">${badgeHtml}</div>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script>
</body>
</html>`;

      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();

      toast.success(`Generated ${badges.length} badges`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to generate badges");
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  }, [guests, eventName, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> Print All Badges
          </DialogTitle>
          <DialogDescription>
            Generate and print QR code badges for {guests.length} guests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Guests</span>
              <span className="text-sm text-muted-foreground">
                {guests.length}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-medium">Format</span>
              <span className="text-sm text-muted-foreground">
                2-up badge sheet
              </span>
            </div>
          </div>

          {generating && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Generating QR codes... {progress}%
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handlePrintAll}
              disabled={generating || guests.length === 0}
            >
              <Printer className="h-4 w-4" />
              {generating ? "Generating..." : "Print Badges"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

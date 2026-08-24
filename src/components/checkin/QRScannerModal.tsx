"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, ZoomIn, CheckCircle2, XCircle, Loader2, LogOut, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScanResult =
  | { status: "success"; attendeeName: string; ticketType: string; barcode: string }
  | { status: "already_checked_in"; attendeeName: string; barcode: string }
  | { status: "not_found"; barcode: string }
  | { status: "wrong_event"; barcode: string }
  | { status: "error"; barcode: string; message: string }
  | { status: "voided"; attendeeName: string; barcode: string }
  | { status: "expired"; attendeeName: string; barcode: string; expiresAt?: string };

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => Promise<ScanResult>;
}

export function QRScannerModal({ open, onClose, onScan }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const lastBarcodeRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const onScanRef = useRef(onScan);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultTouchStartRef = useRef<number | null>(null);

  // Keep the latest validation callback without making the camera session
  // restart when a parent mutation changes identity during a scan.
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      BrowserMultiFormatReader.releaseAllStreams();
      readerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      
      setIsScanning(true);
      setLastResult(null);
      lastBarcodeRef.current = null;
      
      // Request the device's normal rear camera on phones. There is no camera
      // picker: browsers choose the best available environment-facing camera.
      await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoRef.current,
        async (result, error) => {
          if (result) {
            const barcode = result.getText();

            // ZXing can emit the same frame several times while the network
            // validation is pending. Only one request may be active.
            if (isProcessingRef.current) return;
            
            // Debounce — ignore same barcode for 3 seconds
            if (lastBarcodeRef.current === barcode) return;
            lastBarcodeRef.current = barcode;

            if (cooldownRef.current) clearTimeout(cooldownRef.current);
            cooldownRef.current = setTimeout(() => {
              lastBarcodeRef.current = null;
            }, 3000);
            
            isProcessingRef.current = true;
            setIsProcessing(true);
            try {
              const scanResult = await onScanRef.current(barcode);
              setLastResult(scanResult);
            } catch (scanError) {
              // Never leave the scanner looking idle when the validation
              // request fails.  Surface the rejection so staff can retry and
              // continue scanning instead of assuming the camera did nothing.
              console.error("Ticket scan failed:", scanError);
              setLastResult({
                status: "error",
                barcode,
                message: "Could not reach the ticket service. Check the connection and try again.",
              });
            } finally {
              isProcessingRef.current = false;
              setIsProcessing(false);
            }
          }
          if (error && !(error instanceof NotFoundException)) {
            console.warn("Scanner error:", error);
          }
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
      setHasCamera(false);
      setIsScanning(false);
    }
  }, []);

  const dismissResult = useCallback(() => {
    setLastResult(null);
    isProcessingRef.current = false;
    setIsProcessing(false);
    // Allow the same ticket to be scanned again only after the staff member
    // explicitly dismisses the result (the normal 3-second debounce remains).
    lastBarcodeRef.current = null;
  }, []);

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
      isProcessingRef.current = false;
      setLastResult(null);
    }
    
    return () => {
      stopScanning();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [open, startScanning, stopScanning]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-black/90 backdrop-blur-sm safe-area-inset-top">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white" aria-label="QR scanner">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
          {isScanning && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-400" aria-label="Scanner live">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full text-white hover:bg-white/10" onClick={onClose} aria-label="Log out of staff scanner" title="Log out">
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
        {!hasCamera ? (
          <div className="flex flex-col items-center gap-4 text-white p-8 text-center">
            <CameraOff className="h-16 w-16 opacity-40" />
            <p className="text-lg font-medium">Camera not available</p>
            <p className="text-sm text-zinc-400">Allow camera access in your browser settings and try again.</p>
            <Button variant="outline" onClick={onClose} className="mt-2">Close</Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scan Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Dimmed border areas */}
              <div className="absolute inset-0 bg-black/40" />
              
              {/* Clear scanning window */}
              <div className="relative z-10 w-72 h-72 sm:w-80 sm:h-80">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg" />
                
                {/* Scan laser line */}
                <div
                  className={cn(
                    "absolute left-4 right-4 h-0.5 bg-linear-to-r from-transparent via-green-400 to-transparent",
                    "animate-[scanline_2s_ease-in-out_infinite]"
                  )}
                  style={{ animation: "scanline 2s ease-in-out infinite" }}
                />

                {/* Clear window */}
                <div className="absolute inset-0 bg-transparent" />
              </div>
            </div>

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                  <span className="text-sm font-medium">Looking up ticket...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Result Banner */}
      <div
        className={cn(
          "relative min-h-[150px] px-4 pt-5 pb-6 flex flex-col items-center justify-center gap-3 transition-colors touch-pan-y",
          lastResult === null
            ? "bg-zinc-900"
            : lastResult.status === "success"
              ? "bg-emerald-700"
              : "bg-red-700"
        )}
        onTouchStart={(event) => {
          resultTouchStartRef.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = resultTouchStartRef.current;
          const end = event.changedTouches[0]?.clientX;
          resultTouchStartRef.current = null;
          if (lastResult && start !== null && end !== undefined && Math.abs(end - start) > 64) dismissResult();
        }}
      >
        {lastResult ? (
          <button type="button" onClick={dismissResult} aria-label="Dismiss scan result and scan next ticket" title="Scan next ticket" className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <ScanLine className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        {lastResult === null ? (
          <div className="flex flex-col items-center gap-2 text-zinc-400 text-center">
            <ZoomIn className="h-8 w-8 opacity-40" />
            <p className="text-sm">Point the camera at a ticket QR code</p>
          </div>
        ) : lastResult.status === "success" ? (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
            <p className="text-white font-bold text-lg">{lastResult.attendeeName}</p>
            <Badge className="bg-green-500 text-white border-0 px-3">{lastResult.ticketType}</Badge>
                  <p className="text-green-400 font-semibold">✓ Checked In Successfully</p>
                  <p className="text-xs text-white/70">Swipe or tap the scan icon for the next ticket</p>
          </div>
        ) : lastResult.status === "already_checked_in" ? (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <XCircle className="h-10 w-10 text-red-100" />
            <p className="text-white font-bold text-lg">{lastResult.attendeeName}</p>
            <p className="text-red-100 font-semibold">Already Scanned — Entry Denied</p>
            <p className="text-xs text-white/70">Swipe or tap the scan icon for the next ticket</p>
          </div>
        ) : lastResult.status === "expired" ? (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <XCircle className="h-10 w-10 text-amber-200" />
            <p className="text-white font-bold text-lg">{lastResult.attendeeName}</p>
            <p className="text-amber-100 font-semibold">Ticket Expired — Entry Denied</p>
            {lastResult.expiresAt ? <p className="text-xs text-white/80">Expired {new Date(lastResult.expiresAt).toLocaleString()}</p> : null}
            <p className="text-xs text-white/70">Swipe or tap the scan icon for the next ticket</p>
          </div>
        ) : lastResult.status === "voided" ? (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <XCircle className="h-10 w-10 text-red-100" />
            <p className="text-white font-bold text-lg">{lastResult.attendeeName}</p>
            <p className="text-red-100 font-semibold">Ticket is Voided — Entry Denied</p>
            <p className="text-xs text-white/70">Swipe or tap the scan icon for the next ticket</p>
          </div>
        ) : lastResult.status === "wrong_event" ? (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <XCircle className="h-10 w-10 text-amber-200" />
            <p className="text-white font-bold text-lg">Wrong Event Selected</p>
            <p className="text-amber-100 font-semibold">Select the event assigned to this ticket</p>
            <p className="text-xs text-white/70">Swipe or tap the scan icon for the next ticket</p>
          </div>
        ) : lastResult.status === "error" ? (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <XCircle className="h-10 w-10 text-amber-200" />
            <p className="text-white font-bold text-lg">Scan Unavailable</p>
            <p className="text-amber-100 font-semibold">{lastResult.message}</p>
            <p className="text-xs text-white/70">Swipe or tap the scan icon to try again</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <XCircle className="h-10 w-10 text-red-100" />
            <p className="text-white font-bold text-lg">Scan Rejected</p>
            <p className="text-red-100 font-semibold">Ticket Not Found — Entry Denied</p>
            <p className="text-xs text-white/70">Swipe or tap the scan icon for the next ticket</p>
            <p className="text-red-100/80 text-xs font-mono">{lastResult.barcode}</p>
          </div>
        )}
      </div>

      {/* Scanline CSS animation */}
      <style>{`
        @keyframes scanline {
          0% { top: 16px; opacity: 1; }
          50% { top: calc(100% - 16px); opacity: 1; }
          100% { top: 16px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

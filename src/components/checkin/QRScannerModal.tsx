"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Camera, CameraOff, ZoomIn, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScanResult =
  | { status: "success"; attendeeName: string; ticketType: string; barcode: string }
  | { status: "already_checked_in"; attendeeName: string; barcode: string }
  | { status: "not_found"; barcode: string }
  | { status: "voided"; attendeeName: string; barcode: string };

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
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const lastBarcodeRef = useRef<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameras(devices);
      
      const deviceId = selectedCamera ?? devices.at(-1)?.deviceId; // prefer back camera (usually last)
      
      setIsScanning(true);
      setLastResult(null);
      lastBarcodeRef.current = null;
      
      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        async (result, error) => {
          if (result) {
            const barcode = result.getText();
            
            // Debounce — ignore same barcode for 3 seconds
            if (lastBarcodeRef.current === barcode) return;
            lastBarcodeRef.current = barcode;

            if (cooldownRef.current) clearTimeout(cooldownRef.current);
            cooldownRef.current = setTimeout(() => {
              lastBarcodeRef.current = null;
            }, 3000);
            
            setIsProcessing(true);
            try {
              const scanResult = await onScan(barcode);
              setLastResult(scanResult);
            } finally {
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
  }, [onScan, selectedCamera]);

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
      setLastResult(null);
    }
    
    return () => {
      stopScanning();
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [open, startScanning, stopScanning]);

  // Restart when camera changes
  useEffect(() => {
    if (isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-white" />
          <span className="text-white font-semibold">Scan QR Code</span>
          {isScanning && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <select
              className="text-xs bg-zinc-800 text-white rounded px-2 py-1 border border-zinc-600"
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
            >
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
            <X className="h-5 w-5" />
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
                    "absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent",
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
      <div className="min-h-[120px] bg-zinc-900 px-4 pt-4 pb-6 flex flex-col items-center justify-center gap-3">
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
          </div>
        ) : lastResult.status === "already_checked_in" ? (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <CheckCircle2 className="h-10 w-10 text-amber-400" />
            <p className="text-white font-bold text-lg">{lastResult.attendeeName}</p>
            <p className="text-amber-400 font-medium">Already Checked In</p>
          </div>
        ) : lastResult.status === "voided" ? (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <XCircle className="h-10 w-10 text-red-400" />
            <p className="text-white font-bold text-lg">{lastResult.attendeeName}</p>
            <p className="text-red-400 font-medium">Ticket is Voided</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center animate-in fade-in-0 duration-300">
            <XCircle className="h-10 w-10 text-red-400" />
            <p className="text-red-400 font-medium">Ticket Not Found</p>
            <p className="text-zinc-500 text-xs font-mono">{lastResult.barcode}</p>
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

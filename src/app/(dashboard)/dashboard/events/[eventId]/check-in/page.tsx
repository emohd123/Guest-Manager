"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  CheckCircle,
  XCircle,
  User,
  Clock,
  Smartphone,
  ScanLine,
  LogOut,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function ArrivalsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: scanData, isLoading } = trpc.scans.list.useQuery({
    eventId,
    limit: 100,
  });

  const allScans = scanData?.scans ?? [];

  const filteredScans = allScans.filter((scan) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = `${scan.guestFirstName ?? ""} ${scan.guestLastName ?? ""} ${scan.attendeeName ?? ""}`.toLowerCase();
    const barcode = (scan.barcode ?? "").toLowerCase();
    return name.includes(query) || barcode.includes(query);
  });

  const checkedInCount = allScans.filter((s) => s.scanType === "check_in").length;
  const invalidCount = allScans.filter((s) => s.scanType === "invalid").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arrivals</h1>
          <p className="text-muted-foreground text-sm">Live feed of check-ins and scan activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/checkin/${eventId}`} target="_blank">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <ScanLine className="h-4 w-4" /> Open Scanner
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{checkedInCount}</div>
            <div className="text-xs text-muted-foreground">Checked In</div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{invalidCount}</div>
            <div className="text-xs text-muted-foreground">Invalid Scans</div>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-lg border bg-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <ScanLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{allScans.length}</div>
            <div className="text-xs text-muted-foreground">Total Scans</div>
          </div>
        </div>
      </div>

      {/* Search and Live Indicator */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-border bg-background"
          />
        </div>
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">Live Feed Active</span>
          </div>
        </div>
      </div>

      {/* Scans Log Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-muted-foreground bg-muted/30 border-b border-border uppercase tracking-wide">
          <div className="col-span-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Time</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-4 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Attendee</div>
          <div className="col-span-2 flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Device</div>
          <div className="col-span-2">Result</div>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          ) : filteredScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <ScanLine className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium text-foreground">No scans yet</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? "No results match your search."
                  : "Start checking in guests to see the live arrivals feed."}
              </p>
            </div>
          ) : (
            filteredScans.map((scan) => {
              const isCheckIn = scan.scanType === "check_in";
              const isCheckOut = scan.scanType === "checkout";
              const displayName =
                scan.attendeeName ||
                (scan.guestFirstName
                  ? `${scan.guestFirstName} ${scan.guestLastName ?? ""}`.trim()
                  : null) ||
                "Unknown Guest";
              const deviceStr =
                (scan.deviceInfo as Record<string, string>)?.deviceName ?? "Scanner";
              const scannedAt = new Date(scan.scannedAt);

              return (
                <div
                  key={scan.id}
                  className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/20 transition-colors"
                >
                  {/* Time */}
                  <div className="col-span-2">
                    <div className="font-medium tabular-nums">
                      {format(scannedAt, "h:mm:ss a")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(scannedAt, { addSuffix: true })}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="col-span-2">
                    {isCheckIn && (
                      <Badge className="gap-1 bg-green-100 text-green-700 border-0 dark:bg-green-900/30 dark:text-green-400 font-medium">
                        <CheckCircle className="h-3 w-3" /> Check In
                      </Badge>
                    )}
                    {isCheckOut && (
                      <Badge className="gap-1 bg-blue-100 text-blue-700 border-0 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                        <LogOut className="h-3 w-3" /> Check Out
                      </Badge>
                    )}
                    {scan.scanType === "invalid" && (
                      <Badge className="gap-1 bg-red-100 text-red-700 border-0 dark:bg-red-900/30 dark:text-red-400 font-medium">
                        <XCircle className="h-3 w-3" /> Invalid
                      </Badge>
                    )}
                  </div>

                  {/* Attendee */}
                  <div className="col-span-4 flex items-center gap-2.5 overflow-hidden">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{displayName}</div>
                      {scan.barcode && (
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {scan.barcode}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Device */}
                  <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground truncate">
                    <Smartphone className="h-4 w-4 shrink-0" />
                    <span className="truncate text-xs">{deviceStr}</span>
                  </div>

                  {/* Result */}
                  <div className="col-span-2">
                    <span
                      className={
                        isCheckIn
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : "text-destructive font-medium"
                      }
                    >
                      {scan.result || (isCheckIn ? "Success" : isCheckOut ? "Checked out" : "Failed")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

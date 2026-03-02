"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle, LogOut, ScanLine, Search, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const checkinV2Enabled = process.env.NEXT_PUBLIC_CHECKIN_APP_V2_ENABLED !== "false";

export default function ArrivalsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<"all" | "check_in" | "checkout" | "invalid">("all");

  const { data, isLoading } = trpc.scans.arrivals.useQuery({
    eventId,
    search: search.trim() ? search : undefined,
    action: action === "all" ? undefined : action,
    limit: 300,
    offset: 0,
  });

  const rows = useMemo(() => data?.scans ?? [], [data?.scans]);
  const totals = useMemo(() => {
    const checkedIn = rows.filter((row) => row.scanType === "check_in").length;
    const checkedOut = rows.filter((row) => row.scanType === "checkout").length;
    const invalid = rows.filter((row) => row.scanType === "invalid").length;
    return { checkedIn, checkedOut, invalid };
  }, [rows]);

  if (!checkinV2Enabled) {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold">Check-in App V2 is disabled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enable `CHECKIN_APP_V2_ENABLED` to use arrivals reporting.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Arrivals</h1>
          <p className="text-sm text-muted-foreground">Detailed check-in and scan activity log</p>
        </div>
        <Link href={`/checkin/${eventId}`} target="_blank">
          <Button className="gap-2">
            <ScanLine className="h-4 w-4" />
            Open Scanner
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Check-ins" value={totals.checkedIn} tone="green" />
        <StatCard label="Check-outs" value={totals.checkedOut} tone="blue" />
        <StatCard label="Invalid" value={totals.invalid} tone="red" />
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search barcode, attendee, or guest..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "check_in", "checkout", "invalid"] as const).map((item) => (
            <Button
              key={item}
              variant={action === item ? "default" : "outline"}
              size="sm"
              onClick={() => setAction(item)}
            >
              {item === "all"
                ? "All"
                : item === "check_in"
                ? "Check in"
                : item === "checkout"
                ? "Check out"
                : "Invalid"}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
          <div className="col-span-3">Scanned At</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-3">Attendee</div>
          <div className="col-span-2">Device</div>
          <div className="col-span-2">Result</div>
        </div>

        <div className="divide-y">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading arrivals…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No arrivals match your filters.
            </div>
          ) : (
            rows.map((row) => {
              const attendee =
                row.attendeeName ||
                `${row.guestFirstName ?? ""} ${row.guestLastName ?? ""}`.trim() ||
                "Unknown";
              const when = new Date(row.scannedAt);
              return (
                <div key={row.id} className="grid grid-cols-12 gap-3 px-4 py-3 text-sm">
                  <div className="col-span-3">
                    <div>{format(when, "MMM d, yyyy h:mm:ss a")}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(when, { addSuffix: true })}
                    </div>
                  </div>
                  <div className="col-span-2">
                    {row.scanType === "check_in" ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Check in
                      </Badge>
                    ) : row.scanType === "checkout" ? (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <LogOut className="mr-1 h-3 w-3" />
                        Check out
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="mr-1 h-3 w-3" />
                        Invalid
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-3">
                    <div className="font-medium">{attendee}</div>
                    <div className="text-xs font-mono text-muted-foreground">{row.barcode ?? "—"}</div>
                  </div>
                  <div className="col-span-2">
                    <div>{row.deviceName ?? "Web / Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{row.method}</div>
                  </div>
                  <div className="col-span-2">{row.result ?? "—"}</div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "text-green-600"
      : tone === "red"
      ? "text-red-600"
      : "text-blue-600";

  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
    </Card>
  );
}

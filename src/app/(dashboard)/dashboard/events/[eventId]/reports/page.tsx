"use client";

import { use, useMemo, type ReactNode } from "react";
import { Download, CheckCircle, XCircle, Users, LogOut } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const checkinV2Enabled = process.env.NEXT_PUBLIC_CHECKIN_APP_V2_ENABLED !== "false";

export default function ReportsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data, isLoading } = trpc.reports.checkInSummary.useQuery({ eventId });
  const checkinsExport = trpc.reports.exportCheckinsCsv.useQuery(
    { eventId },
    { enabled: false }
  );
  const noShowsExport = trpc.reports.exportNoShowsCsv.useQuery(
    { eventId },
    { enabled: false }
  );
  const arrivalsExport = trpc.reports.exportArrivalsCsv.useQuery(
    { eventId },
    { enabled: false }
  );

  const chartData = useMemo(
    () => [
      { metric: "Check-ins", value: data?.checkedIn ?? 0 },
      { metric: "Check-outs", value: data?.checkedOut ?? 0 },
      { metric: "No-show", value: data?.noShow ?? 0 },
      { metric: "Invalid", value: data?.unsuccessfulScans ?? 0 },
    ],
    [data]
  );

  if (!checkinV2Enabled) {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold">Check-in App V2 is disabled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enable `CHECKIN_APP_V2_ENABLED` to use check-in report exports.
        </p>
      </Card>
    );
  }

  async function downloadCsv(kind: "checkins" | "noShows" | "arrivals") {
    try {
      const source =
        kind === "checkins"
          ? checkinsExport
          : kind === "noShows"
          ? noShowsExport
          : arrivalsExport;

      const result = await source.refetch();
      const payload = result.data;
      if (!payload?.csv) {
        toast.error("No data to export");
        return;
      }

      const blob = new Blob([payload.csv], { type: payload.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = payload.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV export started");
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Check-in Report</h1>
          <p className="text-sm text-muted-foreground">Live summary and CSV exports for this event.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => downloadCsv("checkins")}>
            <Download className="h-4 w-4" />
            Export check-ins
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => downloadCsv("noShows")}>
            <Download className="h-4 w-4" />
            Export no-shows
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => downloadCsv("arrivals")}>
            <Download className="h-4 w-4" />
            Export arrivals
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Checked In" value={data?.checkedIn ?? 0} icon={<CheckCircle className="h-4 w-4 text-green-600" />} />
        <Metric title="Checked Out" value={data?.checkedOut ?? 0} icon={<LogOut className="h-4 w-4 text-blue-600" />} />
        <Metric title="No Show" value={data?.noShow ?? 0} icon={<XCircle className="h-4 w-4 text-red-600" />} />
        <Metric title="Total Guests" value={data?.totalGuests ?? 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading report…</div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

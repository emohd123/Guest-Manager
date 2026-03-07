"use client";

import { use, useMemo } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  const timeSeriesData = useMemo(() => {
    return (data?.arrivalsTimeSeries ?? []).map((pt) => ({
      time: pt.hour ? format(new Date(String(pt.hour)), "h:mm a") : "",
      Success: pt.success,
      Failure: pt.failure,
    }));
  }, [data]);

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
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4 flex-1">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-red-500 mb-1">Report</h1>
            <h2 className="text-3xl font-light text-slate-400">Activity & Arrivals</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2 text-muted-foreground shadow-sm" onClick={() => downloadCsv("checkins")}>
              <Download className="h-4 w-4" />
              Export checkins
            </Button>
            <Button variant="outline" className="gap-2 text-muted-foreground shadow-sm" onClick={() => downloadCsv("noShows")}>
              <Download className="h-4 w-4" />
              Export no shows
            </Button>
            <Button variant="outline" className="gap-2 text-muted-foreground shadow-sm" onClick={() => downloadCsv("arrivals")}>
              <Download className="h-4 w-4" />
              Export Arrivals
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-0 lg:ml-auto shrink-0 bg-white border border-slate-100 shadow-sm rounded-md overflow-hidden">
          <Metric title="Checkins" value={data?.checkedIn ?? 0} valueColor="text-[#2eb85c]" />
          <div className="w-px h-16 bg-slate-100" />
          <Metric title="No show" value={data?.noShow ?? 0} valueColor="text-[#e55353]" />
          <div className="w-px h-16 bg-slate-100" />
          <Metric title="Total" value={data?.totalGuests ?? 0} valueColor="text-slate-700" />
        </div>
      </div>

      <div className="mt-12 space-y-4">
        <h3 className="text-xl font-bold text-slate-500">Checkins by ticket type</h3>
        <Card className="shadow-sm border-slate-100 rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="font-bold text-slate-600 h-12">Ticket Type</TableHead>
                <TableHead className="font-bold text-slate-600 text-right h-12">Checked In</TableHead>
                <TableHead className="font-bold text-slate-600 text-right h-12">Checked Out</TableHead>
                <TableHead className="font-bold text-slate-600 text-right h-12">No show</TableHead>
                <TableHead className="font-bold text-slate-600 text-right h-12">Total</TableHead>
                <TableHead className="font-bold text-slate-600 text-right h-12">Arrived</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.checkinsByTicketType?.map((row) => (
                <TableRow key={row.id} className="border-b-slate-100">
                  <TableCell className="text-slate-500">{row.name}</TableCell>
                  <TableCell className={`text-right font-medium ${row.checkedIn > 0 ? "text-[#2eb85c]" : "text-slate-400"}`}>
                    {row.checkedIn}
                  </TableCell>
                  <TableCell className="text-right text-slate-400">{row.checkedOut}</TableCell>
                  <TableCell className={`text-right font-medium ${row.noShow > 0 ? "text-[#e55353]" : "text-slate-400"}`}>
                    {row.noShow}
                  </TableCell>
                  <TableCell className="text-right text-slate-500">{row.total}</TableCell>
                  <TableCell className="text-right text-slate-500">{row.arrivedPct}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-50 border-t-2 border-slate-200 hover:bg-slate-50">
                <TableCell className="font-bold text-slate-600">Totals</TableCell>
                <TableCell className="text-right font-bold text-[#2eb85c]">
                  {data?.checkinsByTicketType?.reduce((acc, r) => acc + r.checkedIn, 0) ?? 0}
                </TableCell>
                <TableCell className="text-right font-bold text-slate-600">
                  {data?.checkinsByTicketType?.reduce((acc, r) => acc + r.checkedOut, 0) ?? 0}
                </TableCell>
                <TableCell className="text-right font-bold text-[#e55353]">
                  {data?.checkinsByTicketType?.reduce((acc, r) => acc + r.noShow, 0) ?? 0}
                </TableCell>
                <TableCell className="text-right font-bold text-slate-600">
                  {data?.checkinsByTicketType?.reduce((acc, r) => acc + r.total, 0) ?? 0}
                </TableCell>
                <TableCell className="text-right font-bold text-slate-600">
                  {data?.totalGuests ? Math.round(((data?.checkedIn ?? 0) / (data?.totalGuests ?? 1)) * 100) : 0}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="mt-12">
        <Card className="shadow-sm border-slate-100 rounded-md">
          <div className="px-6 py-4 text-xs font-semibold text-slate-500 border-b border-slate-50">
            Arrivals by result
          </div>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-sm text-slate-400 p-10 text-center">Loading chart...</div>
            ) : timeSeriesData.length === 0 ? (
              <div className="text-sm text-slate-400 p-10 text-center">No arrivals recorded yet</div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeriesData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tickMargin={12} 
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickMargin={12} 
                      allowDecimals={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <Tooltip cursor={{ fill: "#f8fafc" }} />
                    <Legend iconType="rect" iconSize={12} wrapperStyle={{ fontSize: "11px", color: "#64748b", marginTop: "-30px", marginBottom: "30px" }} verticalAlign="top" />
                    <Bar dataKey="Success" fill="#82ca9d" radius={[0, 0, 0, 0]} maxBarSize={150} />
                    <Bar dataKey="Failure" fill="#ff7f7f" radius={[0, 0, 0, 0]} maxBarSize={150} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 space-y-2">
        <h3 className="text-xl font-bold text-slate-500">Tallies</h3>
        <p className="text-xs text-slate-400 italic">Not configured</p>
      </div>
      
      <div className="mt-8 space-y-2">
        <h3 className="text-xl font-bold text-slate-500">Product pickups</h3>
        <p className="text-xs text-slate-400 italic">Not configured</p>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  valueColor
}: {
  title: string;
  value: number;
  valueColor: string;
}) {
  return (
    <div className="px-8 py-5 flex flex-col items-center justify-center min-w[140px] bg-transparent">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</div>
      <div className={`text-3xl font-bold ${valueColor}`}>{value.toLocaleString()}</div>
    </div>
  );
}

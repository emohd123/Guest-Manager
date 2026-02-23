"use client";

import Link from "next/link";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarDays,
  Download,
  CheckCircle,
  Ticket,
  DollarSign,
  ArrowRight,
} from "lucide-react";

export default function ReportsPage() {
  const { data: eventStats, isLoading: statsLoading } = trpc.events.stats.useQuery();
  const { data: eventsData, isLoading: eventsLoading } = trpc.events.list.useQuery({
    limit: 20,
    offset: 0,
  });
  const { data: orderStats } = trpc.orders.stats.useQuery({});

  const totalEvents = eventStats?.total ?? 0;
  const totalGuests = eventStats?.totalGuests ?? 0;
  const totalCheckIns = eventStats?.totalCheckIns ?? 0;
  const attendanceRate = totalGuests > 0 ? Math.round((totalCheckIns / totalGuests) * 100) : 0;

  const overviewStats = [
    {
      title: "Total Events",
      value: statsLoading ? "—" : totalEvents.toString(),
      icon: CalendarDays,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "Total Guests",
      value: statsLoading ? "—" : totalGuests.toString(),
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/50",
    },
    {
      title: "Total Check-ins",
      value: statsLoading ? "—" : totalCheckIns.toString(),
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      title: "Attendance Rate",
      value: statsLoading ? "—" : `${attendanceRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/50",
    },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights across all your events.
          </p>
        </div>
        <Button variant="outline" className="gap-2" disabled>
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Performance</CardTitle>
              <CardDescription>
                Overview of your events with guest and check-in metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : !eventsData?.events?.length ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No events yet. Create events to see performance data here.
                  </p>
                  <Link href="/dashboard/events/new">
                    <Button variant="outline" size="sm" className="mt-4">
                      Create Event
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Event</th>
                        <th className="pb-3 pr-4 font-medium">Date</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 pr-4 font-medium">Capacity</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {eventsData.events.map((event) => (
                        <tr key={event.id} className="hover:bg-muted/30">
                          <td className="py-3 pr-4">
                            <p className="font-medium">{event.title}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {event.eventType.replace("_", " ")}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {format(new Date(event.startsAt), "MMM d, yyyy")}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant="secondary"
                              className={`capitalize ${statusColors[event.status]}`}
                            >
                              {event.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {event.maxCapacity ?? "∞"}
                          </td>
                          <td className="py-3">
                            <Link href={`/dashboard/events/${event.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                View <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {eventsData.total > eventsData.events.length && (
                    <div className="mt-4 flex justify-center">
                      <Link href="/dashboard/events">
                        <Button variant="outline" size="sm">
                          View All {eventsData.total} Events
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Overall attendance summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overall Attendance</CardTitle>
                <CardDescription>
                  Across all events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : totalGuests === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No guest data yet. Add guests to your events to see attendance.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Checked In</span>
                        <span className="font-medium">{totalCheckIns} / {totalGuests}</span>
                      </div>
                      <Progress value={attendanceRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">{attendanceRate}% attendance rate</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <AttendanceStat
                        label="Checked In"
                        count={totalCheckIns}
                        total={totalGuests}
                        color="bg-green-500"
                      />
                      <AttendanceStat
                        label="Not Yet Arrived"
                        count={totalGuests - totalCheckIns}
                        total={totalGuests}
                        color="bg-gray-300 dark:bg-gray-600"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Per-event breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Summary</CardTitle>
                <CardDescription>
                  {totalEvents} event{totalEvents !== 1 ? "s" : ""} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(["draft", "published", "completed", "cancelled"] as const).map((status) => {
                      const count = eventsData?.events?.filter((e) => e.status === status).length ?? 0;
                      if (count === 0) return null;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={`capitalize ${statusColors[status]}`}
                            >
                              {status}
                            </Badge>
                          </div>
                          <span className="text-sm font-medium">{count} event{count !== 1 ? "s" : ""}</span>
                        </div>
                      );
                    })}
                    {totalEvents === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        No events yet
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Overview</CardTitle>
                <CardDescription>Total from completed orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-4xl font-bold">
                    ${((orderStats?.revenue ?? 0) / 100).toFixed(2)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div className="divide-y">
                  <div className="flex justify-between py-3 text-sm">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-medium">{orderStats?.totalOrders ?? 0}</span>
                  </div>
                  <div className="flex justify-between py-3 text-sm">
                    <span className="text-muted-foreground">Tickets Sold</span>
                    <span className="font-medium">{orderStats?.ticketsSold ?? 0}</span>
                  </div>
                  <div className="flex justify-between py-3 text-sm">
                    <span className="text-muted-foreground">Avg Order Value</span>
                    <span className="font-medium">
                      ${orderStats?.totalOrders
                        ? ((orderStats.revenue / orderStats.totalOrders) / 100).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Stripe Integration</CardTitle>
                  <Badge variant="secondary">Not Connected</Badge>
                </div>
                <CardDescription>
                  Connect Stripe to accept online ticket payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#635BFF]/10">
                    <span className="text-2xl font-bold text-[#635BFF]">S</span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Connect your Stripe account to start accepting payments and track revenue here.
                  </p>
                  <Link href="/dashboard/settings">
                    <Button variant="outline" size="sm" className="mt-4">
                      Go to Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AttendanceStat({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-sm font-medium">{count}</span>
      <span className="text-xs text-muted-foreground">({pct}%)</span>
    </div>
  );
}

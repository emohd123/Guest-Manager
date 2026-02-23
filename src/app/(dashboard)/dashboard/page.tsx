"use client";

import Link from "next/link";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import {
  CalendarDays,
  Users,
  Ticket,
  CheckCircle,
  ArrowRight,
  Plus,
  TrendingUp,
  Clock,
  Upload,
  UserPlus,
  ScanLine,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: eventStats, isLoading: eventsLoading } = trpc.events.stats.useQuery();
  const { data: upcomingEvents, isLoading: upcomingLoading } = trpc.events.list.useQuery({
    status: "published",
    limit: 5,
    offset: 0,
  });

  const totalEvents = eventStats?.total ?? 0;
  const totalGuests = eventStats?.totalGuests ?? 0;
  const totalCheckIns = eventStats?.totalCheckIns ?? 0;

  const stats = [
    {
      title: "Total Events",
      value: eventsLoading ? "—" : totalEvents.toString(),
      icon: CalendarDays,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "Total Guests",
      value: eventsLoading ? "—" : totalGuests.toString(),
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/50",
    },
    {
      title: "Tickets Sold",
      value: "0",
      icon: Ticket,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/50",
    },
    {
      title: "Check-ins",
      value: eventsLoading ? "—" : totalCheckIns.toString(),
      icon: CheckCircle,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/50",
    },
  ];

  const setupSteps = [
    {
      number: 1,
      title: "Create your first event",
      description: "Set up an event with a date, venue, and guest capacity.",
      href: "/dashboard/events/new",
      icon: CalendarDays,
      done: totalEvents > 0,
    },
    {
      number: 2,
      title: "Import your guest list",
      description: "Upload a CSV, paste from a spreadsheet, or add guests manually.",
      href: "/dashboard/events",
      icon: Upload,
      done: totalGuests > 0,
    },
    {
      number: 3,
      title: "Design your tickets",
      description: "Create branded PDF tickets with QR codes for scanning.",
      href: "/dashboard/tickets",
      icon: Ticket,
      done: false,
    },
    {
      number: 4,
      title: "Try check-in",
      description: "Use the check-in interface to search and check in guests.",
      href: "/dashboard/events",
      icon: ScanLine,
      done: totalCheckIns > 0,
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here&apos;s what&apos;s happening with your events.
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Event
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Getting Started Guide */}
          {completedSteps < setupSteps.length && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Getting Started</CardTitle>
                    <CardDescription>Complete these steps to set up your account</CardDescription>
                  </div>
                  <Badge variant="secondary">{completedSteps}/{setupSteps.length} complete</Badge>
                </div>
                <Progress value={(completedSteps / setupSteps.length) * 100} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                {setupSteps.map((step) => (
                  <SetupStep key={step.number} {...step} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Events</CardTitle>
                <Link href="/dashboard/events">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : !upcomingEvents?.events?.length ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <CalendarDays className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">No upcoming events</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Create your first event to see it here.
                  </p>
                  <Link href="/dashboard/events/new">
                    <Button className="mt-4 gap-2" size="sm">
                      <Plus className="h-4 w-4" /> Create Event
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {upcomingEvents.events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-all duration-200"
                    >
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.startsAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {event.maxCapacity && (
                          <span className="text-xs text-muted-foreground">
                            Cap: {event.maxCapacity}
                          </span>
                        )}
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/events/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/50">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                  </div>
                  Create Event
                </Button>
              </Link>
              <Link href="/dashboard/contacts" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100 dark:bg-purple-900/50">
                    <UserPlus className="h-4 w-4 text-purple-600" />
                  </div>
                  Add Contacts
                </Button>
              </Link>
              <Link href="/dashboard/tickets" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100 dark:bg-green-900/50">
                    <Ticket className="h-4 w-4 text-green-600" />
                  </div>
                  Design Tickets
                </Button>
              </Link>
              <Link href="/dashboard/reports" className="block">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-100 dark:bg-orange-900/50">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </div>
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {totalCheckIns > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{totalCheckIns} check-ins recorded</p>
                      <p className="text-xs text-muted-foreground">Across all events</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No recent activity. Check-ins and ticket sales will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Credits</span>
                <Badge variant="secondary">Free Plan</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Check-ins used</span>
                <span className="font-medium">{totalCheckIns} / 50</span>
              </div>
              <Progress value={Math.min((totalCheckIns / 50) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                50 free check-ins included. Upgrade for unlimited.
              </p>
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm" className="w-full">
                  Upgrade Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SetupStep({
  number,
  title,
  description,
  href,
  icon: Icon,
  done,
}: {
  number: number;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  done: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 shadow-sm hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          done
            ? "bg-green-500 text-white"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {done ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <span className="text-sm font-bold">{number}</span>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Icon className="mt-1 h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

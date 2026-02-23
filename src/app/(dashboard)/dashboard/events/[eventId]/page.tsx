"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ExternalLinkIcon, Plus } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b"];

export default function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });
  const { data: guestStats } = trpc.guests.stats.useQuery({ eventId });
  const { data: ticketTypeStats } = trpc.ticketTypes.stats.useQuery({ eventId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!event) {
    return <div>Event not found.</div>;
  }

  // Mock data for charts
  const emailData = [
    { name: "Delivered", value: 124, count: 124 },
    { name: "Failed delivery", value: 0, count: 0 },
    { name: "Deferred", value: 0, count: 0 },
  ];

  const sourceData = [
    { name: "Imported", value: guestStats?.total || 0, count: guestStats?.total || 0 },
    { name: "Transfer", value: 0, count: 0 },
  ];

  const deliveryData = [
    { name: "Sent", value: 40, count: 40 },
    { name: "Downloaded", value: 20, count: 20 },
    { name: "Unsent", value: ticketTypeStats?.totalSold || 1, count: ticketTypeStats?.totalSold || 1 },
  ];

  const regData = [
    { name: "Registered", value: guestStats?.total || 0, count: guestStats?.total || 0 },
    { name: "Unsold", value: event.maxCapacity ? event.maxCapacity - (guestStats?.total || 0) : 100, count: event.maxCapacity ? event.maxCapacity - (guestStats?.total || 0) : "∞" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground text-sm">Overview dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {event.registrationEnabled && (
            <Button variant="outline" className="gap-2 border-primary/20 text-primary">
              Event page <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
            New Order <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Sent Emails */}
        <Card className="flex flex-col shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">Sent emails</CardTitle>
            <CardDescription>73% open rate</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emailData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {emailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number | undefined, name: string | undefined) => [value || 0, name || ""]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-auto pt-4 space-y-4">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold text-muted-foreground border-b border-border pb-2">
                <div>Result</div>
                <div className="text-right">Count</div>
                <div className="text-right">Action</div>
              </div>
              {emailData.map((item, i) => (
                <div key={item.name} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {item.name}
                  </div>
                  <div className="text-right font-medium">{item.count}</div>
                  <div className="text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendees by Source */}
        <Card className="flex flex-col shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">Attendees by source</CardTitle>
            <CardDescription>{guestStats?.total || 0} total</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number | undefined, name: string | undefined) => [value || 0, name || ""]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-auto pt-4 space-y-4">
              <div className="grid grid-cols-[1fr_auto] gap-4 text-xs font-semibold text-muted-foreground border-b border-border pb-2">
                <div>Source</div>
                <div className="text-right">Action</div>
              </div>
              {["Imported", "Added Onsite", "Order", "RSVP", "Invite", "SMS"].map((source, i) => {
                 const match = sourceData.find(d => d.name === source);
                 const hasData = match && match.count > 0;
                 return (
                  <div key={source} className="grid grid-cols-[1fr_auto] gap-4 items-center text-sm">
                    <div className="flex items-center gap-2 font-medium">
                       {hasData && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[1] }} />}
                       {!hasData && <span className="w-2 h-2 rounded-full bg-muted" />}
                      {source}
                    </div>
                    <div className="text-right">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ticket delivery status */}
        <Card className="flex flex-col shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">Ticket delivery status</CardTitle>
            <CardDescription>&nbsp;</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {deliveryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number | undefined, name: string | undefined) => [value || 0, name || ""]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-auto pt-4 space-y-4">
              <div className="grid grid-cols-[1fr_auto] gap-4 text-xs font-semibold text-muted-foreground border-b border-border pb-2">
                <div>Status</div>
                <div className="text-right">Action</div>
              </div>
              {deliveryData.map((item, i) => (
                <div key={item.name} className="grid grid-cols-[1fr_auto] gap-4 items-center text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                    {item.name}
                  </div>
                  <div className="text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Registrations */}
        <Card className="flex flex-col shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">Registrations</CardTitle>
            <CardDescription>$0.00</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-6">
            <div className="flex items-center justify-center flex-col mt-4 mb-8">
              <div className="flex gap-4 items-end h-32 w-full justify-center opacity-80">
                <div className="w-16 bg-emerald-500 rounded-t-md relative" style={{ height: '20%' }}>
                   <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold">{regData[0].count}</span>
                </div>
                <div className="w-16 bg-rose-500 rounded-t-md relative" style={{ height: '80%' }}>
                   <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold">{regData[1].count}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-4 space-y-4">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold text-muted-foreground border-b border-border pb-2">
                <div>Result</div>
                <div className="text-right">Count</div>
                <div className="text-right">Action</div>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center text-sm">
                  <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    Revenue
                  </div>
                  <div className="text-right font-medium">$0.00</div>
                  <div className="text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLinkIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </Button>
                  </div>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center text-sm">
                  <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    Registered
                  </div>
                  <div className="text-right font-medium">{regData[0].count}</div>
                  <div className="text-right"></div>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center text-sm">
                  <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                    Unsold
                  </div>
                  <div className="text-right font-medium">{regData[1].count}</div>
                  <div className="text-right"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Supplementary Dashboard actions below columns */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
          <CardHeader>
            <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center justify-between">
              Import Attendees <Plus className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Upload a CSV file of attendees, and optionally generate PDF tickets and email them.</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
          <CardHeader>
            <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center justify-between">
              Registration types <Plus className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Sell tickets, registrations, either free or paid, through a public event page.</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
          <CardHeader>
            <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center justify-between">
              Check In Report <ExternalLinkIcon className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">When you have finished checking in your guests, view the online report.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

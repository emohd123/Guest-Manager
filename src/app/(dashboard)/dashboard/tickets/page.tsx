"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket,
  Plus,
  Palette,
  ScanLine,
  QrCode,
  FileText,
  Smartphone,
  DollarSign,
  Hash,
  ExternalLink,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  sold_out: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const templatePreviews = [
  {
    name: "Elegant Minimal",
    description: "Clean design with QR code",
    style: "bg-gradient-to-br from-slate-900 to-slate-700 text-white",
  },
  {
    name: "Bold Color",
    description: "Vibrant gradient with large barcode",
    style: "bg-gradient-to-br from-primary to-blue-600 text-white",
  },
  {
    name: "Classic Formal",
    description: "Traditional ticket with border",
    style: "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900 border-2 border-amber-300",
  },
  {
    name: "Modern Event",
    description: "Dark theme with accent colors",
    style: "bg-gradient-to-br from-gray-900 to-gray-800 text-white",
  },
];

export default function TicketsPage() {
  const { data, isLoading } = trpc.ticketTypes.listAll.useQuery();
  const { data: orderStats } = trpc.orders.stats.useQuery({});

  const ticketTypeList = data?.ticketTypes ?? [];
  const totalTypes = data?.total ?? 0;
  const totalSold = orderStats?.ticketsSold ?? 0;

  const quickStats = [
    {
      label: "Ticket Types",
      value: isLoading ? "—" : totalTypes.toString(),
      icon: Ticket,
      color: "text-blue-600",
    },
    {
      label: "Templates",
      value: "4",
      icon: Palette,
      color: "text-purple-600",
    },
    {
      label: "Sold",
      value: isLoading ? "—" : totalSold.toString(),
      icon: Hash,
      color: "text-green-600",
    },
    {
      label: "Scanned",
      value: "0",
      icon: ScanLine,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ticket Studio</h1>
          <p className="text-muted-foreground">
            Design, distribute, and scan branded tickets for your events.
          </p>
        </div>
        <Link href="/dashboard/events">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Ticket Type
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Ticket Types</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Ticket Types</CardTitle>
              <CardDescription>
                Ticket types across all your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : ticketTypeList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Ticket className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No ticket types yet</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Create ticket types within your events to start designing and
                    distributing tickets. Each event can have multiple ticket tiers.
                  </p>
                  <Link href="/dashboard/events">
                    <Button className="mt-4 gap-2">
                      <Plus className="h-4 w-4" /> Go to Events
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {ticketTypeList.map((tt) => (
                    <div key={tt.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Ticket className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{tt.name}</p>
                            <Badge
                              variant="secondary"
                              className={statusColors[tt.status ?? "active"]}
                            >
                              {tt.status}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            {tt.eventTitle && (
                              <span className="font-medium text-foreground/70">{tt.eventTitle}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {(tt.price ?? 0) === 0
                                ? "Free"
                                : `$${((tt.price ?? 0) / 100).toFixed(2)} ${tt.currency}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {tt.quantityTotal != null
                                ? `${tt.quantitySold ?? 0} / ${tt.quantityTotal} sold`
                                : `${tt.quantitySold ?? 0} sold · unlimited`}
                            </span>
                            <span className="flex items-center gap-1">
                              <QrCode className="h-3 w-3" />
                              {tt.barcodeType?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/dashboard/events/${tt.eventId}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <ExternalLink className="h-3 w-3" /> View Event
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Ticket Templates</h3>
              <p className="text-sm text-muted-foreground">
                Choose a template and customize it for your events.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {templatePreviews.map((template) => (
                <Card key={template.name} className="overflow-hidden">
                  <div className={`flex h-40 flex-col justify-between p-4 ${template.style}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium opacity-80">EVENT NAME</span>
                      <Ticket className="h-4 w-4 opacity-60" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">General Admission</p>
                      <p className="text-xs opacity-70">Mar 15, 2026</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-xs opacity-60">#001234</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white/20">
                        <QrCode className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Supported Formats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <FileText className="h-8 w-8 text-red-500" />
                  <div>
                    <h4 className="font-medium">PDF Tickets</h4>
                    <p className="text-sm text-muted-foreground">
                      High-quality PDF tickets for print or digital delivery via email.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <Smartphone className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-medium">Apple Wallet</h4>
                    <p className="text-sm text-muted-foreground">
                      Add-to-wallet passes for iPhone and Apple Watch.
                    </p>
                    <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <QrCode className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-medium">Barcode Types</h4>
                    <p className="text-sm text-muted-foreground">
                      QR Code, PDF417, and Code128 barcode support.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scanner">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Scanner</CardTitle>
              <CardDescription>
                Scan and validate tickets at the door
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <ScanLine className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Use Event Check-In
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Open the check-in page for a specific event to scan QR codes
                  and verify guest tickets. The scanner is integrated into the
                  check-in kiosk.
                </p>
                <Link href="/dashboard/events">
                  <Button className="mt-6 gap-2">
                    <ScanLine className="h-4 w-4" /> Go to Events
                  </Button>
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">
                  Requires camera permission. Works best in Chrome and Safari.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

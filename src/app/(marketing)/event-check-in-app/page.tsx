import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Search,
  Smartphone,
  WifiOff,
  Users,
  QrCode,
  BarChart3,
  Zap,
  Globe,
  ArrowRight,
  Monitor,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Instant Name Search",
    description:
      "Type-ahead search finds guests in under 100ms. Just start typing a name and tap to check in.",
  },
  {
    icon: Smartphone,
    title: "Unlimited Devices",
    description:
      "Run check-in on as many phones, tablets, and laptops as you need. All devices sync in real-time.",
  },
  {
    icon: WifiOff,
    title: "Offline Mode",
    description:
      "Lost internet? No problem. Check-in continues offline and syncs automatically when reconnected.",
  },
  {
    icon: QrCode,
    title: "QR & Barcode Scanning",
    description:
      "Scan QR codes, PDF417, and Code128 barcodes with any device camera. Duplicate detection built-in.",
  },
  {
    icon: Users,
    title: "Party Check-In",
    description:
      "Check in entire groups at once. Perfect for families, corporate teams, and VIP parties.",
  },
  {
    icon: BarChart3,
    title: "Live Attendance Counter",
    description:
      "Real-time dashboard shows who's arrived, who's missing, and total attendance percentage.",
  },
  {
    icon: Zap,
    title: "Walk-Up Registration",
    description:
      "Add unexpected guests on the spot. They're instantly added to the guest list and checked in.",
  },
  {
    icon: Globe,
    title: "Multi-Device Sync",
    description:
      "Powered by Supabase Realtime. Check someone in on one device, all other devices update instantly.",
  },
];

export default function CheckInAppPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            #1 Event Check-In Platform
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            The fastest way to check in guests
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Upload your guest list, open the app on any device, and start
            checking people in. Real-time sync across unlimited devices with
            offline support.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                Try It Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Book a Call
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border bg-gradient-to-b from-muted/50 to-background p-8">
          <div className="mx-auto max-w-md space-y-4">
            {/* Check-in screen preview */}
            <div className="rounded-lg border bg-background p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">Check-In</h3>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-bold">156</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-bold">243</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    64%
                  </Badge>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <div className="h-10 rounded-md border bg-muted/50 pl-10 pt-2 text-sm text-muted-foreground">
                  Search by name, email, or table...
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Sarah Johnson", table: "Table 5", checked: true },
                  { name: "Michael Chen", table: "Table 3", checked: true },
                  { name: "Emily Rodriguez", table: "VIP", checked: false },
                ].map((guest) => (
                  <div
                    key={guest.name}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      guest.checked
                        ? "border-green-200 bg-green-50/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          guest.checked
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {guest.checked ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          guest.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{guest.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {guest.table}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={guest.checked ? "default" : "secondary"}
                      className={
                        guest.checked ? "bg-green-500" : ""
                      }
                    >
                      {guest.checked ? "Checked In" : "Tap to check in"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">Everything you need for seamless check-in</h2>
          <p className="mt-3 text-muted-foreground">
            Built for speed, reliability, and ease of use at events of any size.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How it works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Upload Your Guest List",
                description:
                  "Import from CSV, Excel, or paste from a spreadsheet. Map columns automatically.",
                icon: Users,
              },
              {
                step: "2",
                title: "Open on Any Device",
                description:
                  "Access the check-in screen from any phone, tablet, or laptop. No app to install.",
                icon: Monitor,
              },
              {
                step: "3",
                title: "Start Checking In",
                description:
                  "Search by name, scan a QR code, or tap to check in. All devices sync in real-time.",
                icon: CheckCircle,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">
          Ready to simplify your event check-in?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Join thousands of event organizers who trust Events Hub.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

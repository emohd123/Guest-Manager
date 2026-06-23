import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Check,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Instant Name Search",
    color: "blue",
    description:
      "Type-ahead search finds guests in under 100ms. Just start typing a name and tap to check in.",
  },
  {
    icon: Smartphone,
    title: "Unlimited Devices",
    color: "purple",
    description:
      "Run check-in on as many phones, tablets, and laptops as you need. All devices sync in real-time.",
  },
  {
    icon: WifiOff,
    title: "Offline Mode",
    color: "pink",
    description:
      "Lost internet? No problem. Check-in continues offline and syncs automatically when reconnected.",
  },
  {
    icon: QrCode,
    title: "QR & Barcode Scanning",
    color: "blue",
    description:
      "Scan QR codes, PDF417, and Code128 barcodes with any device camera. Duplicate detection built-in.",
  },
  {
    icon: Users,
    title: "Party Check-In",
    color: "purple",
    description:
      "Check in entire groups at once. Perfect for families, corporate teams, and VIP parties.",
  },
  {
    icon: BarChart3,
    title: "Live Attendance Counter",
    color: "pink",
    description:
      "Real-time dashboard shows who's arrived, who's missing, and total attendance percentage.",
  },
  {
    icon: Zap,
    title: "Walk-Up Registration",
    color: "blue",
    description:
      "Add unexpected guests on the spot. They're instantly added to the guest list and checked in.",
  },
  {
    icon: Globe,
    title: "Multi-Device Sync",
    color: "purple",
    description:
      "Powered by Supabase Realtime. Check someone in on one device, all other devices update instantly.",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  pink: "bg-pink-500/10 border-pink-500/20 text-pink-400",
};

export default function CheckInAppPage() {
  return (
    <div className="bg-[#080911] text-white min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(37,99,235,0.12),transparent_70%)] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            #1 Event Check-In Platform
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl lg:text-7xl uppercase leading-none">
            The Fastest Way{" "}
            <span className="block bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
              To Check In Guests
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 leading-relaxed font-medium">
            Upload your guest list, open the app on any device, and start
            checking people in. Real-time sync across unlimited devices with
            offline support.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] hover:shadow-[0_6px_30px_0_rgba(124,77,255,0.55)] bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] hover:opacity-95 text-white border-0 font-bold rounded-full px-8"
            >
              <Link href="/signup">
                Try It Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full font-bold px-8"
            >
              <Link href="/contact">Book a Call</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0e17] p-8 shadow-2xl">
          <div className="mx-auto max-w-md space-y-4">
            {/* Check-in screen preview */}
            <div className="rounded-xl border border-white/10 bg-[#111320] p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Check-In</h3>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="font-bold text-white">156</span>
                  <span className="text-white/40">/</span>
                  <span className="font-bold text-white/60">243</span>
                  <span className="rounded-full bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-0.5 border border-green-500/30">64%</span>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <div className="h-10 rounded-lg border border-white/10 bg-white/5 pl-10 pt-2 text-sm text-white/40">
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
                        ? "border-green-500/30 bg-green-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          guest.checked
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {guest.checked ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          guest.name.split(" ").map((n) => n[0]).join("")
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{guest.name}</p>
                        <p className="text-xs text-white/40">{guest.table}</p>
                      </div>
                    </div>
                    <span className={`rounded-full text-[10px] font-black px-2.5 py-1 border ${
                      guest.checked
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-white/5 text-white/50 border-white/10"
                    }`}>
                      {guest.checked ? "Checked In" : "Tap to check in"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-4">
            Features
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
            Everything You Need for{" "}
            <span className="text-purple-400">Seamless Check-In</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Built for speed, reliability, and ease of use at events of any size.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 hover:border-white/10 hover:-translate-y-1 hover:bg-white/5 transition-all duration-300"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${colorMap[feature.color]}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-white">{feature.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 bg-[#0c0e17] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-4xl font-black uppercase tracking-tighter text-white">
            How It <span className="text-blue-400">Works</span>
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Upload Your Guest List",
                description: "Import from CSV, Excel, or paste from a spreadsheet. Map columns automatically.",
                icon: Users,
                color: "blue",
              },
              {
                step: "2",
                title: "Open on Any Device",
                description: "Access the check-in screen from any phone, tablet, or laptop. No app to install.",
                icon: Monitor,
                color: "purple",
              },
              {
                step: "3",
                title: "Start Checking In",
                description: "Search by name, scan a QR code, or tap to check in. All devices sync in real-time.",
                icon: CheckCircle,
                color: "pink",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border text-xl font-black ${colorMap[item.color]}`}>
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(124,77,255,0.08),transparent_80%)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
            Ready to Simplify{" "}
            <span className="bg-[linear-gradient(110deg,#2563eb,#7c3aed,#db2777)] bg-clip-text text-transparent">
              Your Event Check-In?
            </span>
          </h2>
          <p className="mt-4 text-white/60 text-lg">
            Join thousands of event organizers who trust Events Hub.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] bg-[linear-gradient(135deg,#2563eb,#7c3aed,#db2777)] hover:opacity-95 text-white border-0 font-bold rounded-full px-8"
            >
              <Link href="/signup">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full font-bold px-8"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

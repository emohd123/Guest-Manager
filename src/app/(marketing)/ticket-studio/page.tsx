import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Palette,
  Send,
  ScanLine,
  QrCode,
  Smartphone,
  FileText,
  Mail,
  Shield,
  ArrowRight,
  Sparkles,
  Check,
  Layers,
  Barcode,
} from "lucide-react";

const designFeatures = [
  {
    icon: Palette,
    title: "Visual Ticket Designer",
    color: "purple",
    description: "Drag-and-drop editor to create stunning PDF and Apple Wallet tickets with your branding.",
  },
  {
    icon: QrCode,
    title: "Multiple Barcode Types",
    color: "blue",
    description: "Generate QR codes, PDF417, and Code128 barcodes. Each ticket gets a unique, scannable identifier.",
  },
  {
    icon: FileText,
    title: "PDF Generation",
    color: "pink",
    description: "High-quality PDF tickets generated server-side, ready for print or digital delivery.",
  },
];

const distributeFeatures = [
  {
    icon: Mail,
    title: "Email Delivery",
    color: "blue",
    description: "Automatically send tickets to attendees via email with PDF attachments or download links.",
  },
  {
    icon: Send,
    title: "Bulk Distribution",
    color: "purple",
    description: "Send tickets to your entire guest list with one click. Track delivery status in real-time.",
  },
  {
    icon: Smartphone,
    title: "Mobile-Ready",
    color: "pink",
    description: "Tickets display beautifully on any device. Attendees can show their ticket right from their phone.",
  },
];

const scanFeatures = [
  {
    icon: ScanLine,
    title: "Camera Scanning",
    color: "pink",
    description: "Turn any smartphone into a ticket scanner. No special hardware needed.",
  },
  {
    icon: Shield,
    title: "Duplicate Detection",
    color: "blue",
    description: "Instantly detect and flag duplicate scans. Prevent unauthorized entry with real-time validation.",
  },
  {
    icon: Ticket,
    title: "Scan Logging",
    color: "purple",
    description: "Every scan is logged with timestamp, device, and location. Full audit trail for your records.",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  pink: "bg-pink-500/10 border-pink-500/20 text-pink-400",
};

function FeatureCard({ feature }: { feature: { icon: LucideIcon; title: string; color: string; description: string } }) {
  return (
    <div className="group border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 hover:border-white/10 hover:-translate-y-1 hover:bg-white/5 transition-all duration-300">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${colorMap[feature.color]}`}>
        <feature.icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 font-bold text-white">{feature.title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
    </div>
  );
}

export default function TicketStudioPage() {
  return (
    <div className="bg-[#080911] text-white min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(124,58,237,0.12),transparent_70%)] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            Ticket Studio
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl lg:text-7xl uppercase leading-none">
            Design, Distribute
            <span className="block bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite]">
              & Scan Tickets
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 leading-relaxed font-medium">
            Create beautiful branded tickets with unique barcodes. Send them via
            email and scan at the door with any device.
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
              <Link href="/contact">See It Live</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Step 1: Design */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-purple-400 mb-3">
            Step 1
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Design</h2>
          <p className="mt-2 text-white/60">Create professional tickets with our visual editor.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {designFeatures.map((f) => <FeatureCard key={f.title} feature={f} />)}
        </div>
      </section>

      {/* Step 2: Distribute */}
      <section className="border-t border-white/5 bg-[#0c0e17] px-4 py-20">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400 mb-3">
              Step 2
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Distribute</h2>
            <p className="mt-2 text-white/60">Get tickets into the hands of your attendees effortlessly.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {distributeFeatures.map((f) => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </div>
      </section>

      {/* Step 3: Scan */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-pink-400 mb-3">
            Step 3
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Scan</h2>
          <p className="mt-2 text-white/60">Validate tickets at the door with confidence.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {scanFeatures.map((f) => <FeatureCard key={f.title} feature={f} />)}
        </div>
      </section>

      {/* Barcode Showcase */}
      <section className="border-t border-white/5 bg-[#0c0e17] px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-10 text-3xl font-black uppercase tracking-tighter text-white">
            Supported <span className="text-purple-400">Barcode Types</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "QR Code", desc: "Most popular for mobile tickets", icon: QrCode, color: "purple" },
              { name: "PDF417", desc: "Used by airlines and major venues", icon: Layers, color: "blue" },
              { name: "Code128", desc: "Standard linear barcode", icon: Barcode, color: "pink" },
            ].map((barcode) => (
              <div
                key={barcode.name}
                className="border border-white/5 bg-white/[0.02] rounded-2xl p-6 text-center hover:border-white/10 hover:bg-white/5 transition-all duration-300"
              >
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border ${colorMap[barcode.color]}`}>
                  <barcode.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-white">{barcode.name}</h3>
                <p className="text-sm text-white/60 mt-1">{barcode.desc}</p>
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
            Start Designing{" "}
            <span className="bg-[linear-gradient(110deg,#2563eb,#7c3aed,#db2777)] bg-clip-text text-transparent">
              Tickets Today
            </span>
          </h2>
          <p className="mt-4 text-white/60 text-lg">Create professional tickets in minutes, not hours.</p>
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

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Users,
  Ticket as TicketIcon,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Smartphone,
  BarChart3,
  Globe,
  Sparkles,
  Shield,
  WifiOff,
  RefreshCw,
  Layers,
  Check,
  Plus,
  Minus,
  Sparkle,
  ScanLine,
  Mail,
  TrendingUp,
  Laptop,
  CheckCircle,
  Activity,
  Wifi,
  Sliders,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
} from "lucide-react";
import { LandingHero } from "@/components/landing/landing-hero";
import { BrandMark } from "@/components/brand/brand-mark";
import { FloatingLines } from "@/components/ui/floating-lines";

export default function HomePage() {
  return (
    <div className="bg-[#080911] text-foreground min-h-screen relative overflow-hidden">
      {/* Animated Floating Lines Background */}
      <FloatingLines 
        enabledWaves={["top", "middle", "bottom"]}
        lineCount={[10, 15, 20]}
        lineDistance={[8, 6, 4]}
        bendRadius={5.0}
        bendStrength={-0.5}
        interactive={true}
        parallax={true}
        linesGradient={["#2563eb", "#7c3aed", "#db2777", "#db2777", "#7c3aed", "#2563eb"]}
        animationSpeed={0.7}
      />

      {/* Hero Section */}
      <LandingHero />

      {/* Main Content Area: Bento Grid Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-32 sm:px-6 lg:px-8 -mt-16">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary italic mb-6">
            <Sparkle className="h-3 w-3 animate-spin" />
            Consolidated Platform
          </div>
          <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
            Three Powerful Products. <br/>
            <span className="text-brand-gradient">One Seamless Ecosystem.</span>
          </h2>
          <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-2xl mx-auto font-medium">
            Everything you need to plan events, design passes, and check guests in — built for scale and powered by OneStone Ads.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Cell 1: Event Check-In App (Large: spans 2 cols) */}
          <div className="md:col-span-2 border border-white/5 bg-card/25 backdrop-blur-xl rounded-[32px] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-15px_rgba(124,58,237,0.12)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 mb-6 border border-blue-500/20">
                  <CheckCircle2 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-4">
                  Event Check-In App
                </h3>
                <p className="text-white/70 leading-relaxed font-medium mb-6">
                  Real-time guest check-in across unlimited devices. Instant name search, QR/barcode scanning, and live updates.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Multi-device real-time sync",
                    "Offline-first local caching",
                    "Turn any phone into a barcode scanner",
                    "Instant name & VIP filtering",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/80 font-medium">
                      <Check className="h-4 w-4 text-green-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/event-check-in-app">
                  <Button variant="ghost" className="p-0 text-blue-400 hover:text-blue-300 font-bold tracking-wide uppercase text-xs gap-1.5 hover:bg-transparent">
                    Explore Check-In <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Interactive Demo in Cell */}
              <div className="bg-[#0c0e17] border border-white/10 rounded-2xl p-6 shadow-2xl">
                <CheckInAppDemo />
              </div>
            </div>
          </div>

          {/* Cell 2: Ticket Studio (Medium: spans 1 col) */}
          <div className="border border-white/5 bg-card/25 backdrop-blur-xl rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-15px_rgba(124,58,237,0.12)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-pink-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 mb-6 border border-purple-500/20">
                <TicketIcon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">
                Ticket Studio
              </h3>
              <p className="text-white/70 leading-relaxed font-medium mb-6 text-sm">
                Design custom tickets, generate unique secure barcodes, and distribute passes via email or Apple Wallet.
              </p>
              
              {/* Interactive Pass Visualizer */}
              <div className="mb-6">
                <TicketDesignerDemo />
              </div>
            </div>

            <Link href="/ticket-studio" className="relative z-10">
              <Button variant="ghost" className="p-0 text-purple-400 hover:text-purple-300 font-bold tracking-wide uppercase text-xs gap-1.5 hover:bg-transparent">
                Design Passes <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Cell 3: Registration & Ticketing (Medium: spans 1 col) */}
          <div className="border border-white/5 bg-card/25 backdrop-blur-xl rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-15px_rgba(124,58,237,0.12)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-pink-600/5 via-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 mb-6 border border-pink-500/20">
                <Globe className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">
                Online Booking
              </h3>
              <p className="text-white/70 leading-relaxed font-medium mb-6 text-sm">
                Launch elegant event booking pages, sell tickets securely, and process payments instantly with Stripe.
              </p>

              {/* Checkout Interactive Calculator */}
              <div className="mb-6">
                <CheckoutDemo />
              </div>
            </div>

            <Link href="/registration-ticketing" className="relative z-10">
              <Button variant="ghost" className="p-0 text-pink-400 hover:text-pink-300 font-bold tracking-wide uppercase text-xs gap-1.5 hover:bg-transparent">
                Setup Booking <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Cell 4: Stats - Guests Managed */}
          <div className="border border-white/5 bg-card/25 backdrop-blur-xl rounded-[32px] p-8 text-center flex flex-col items-center justify-center group hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-15px_rgba(124,58,237,0.12)] transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-3">Guests Managed</p>
            <h4 className="text-5xl font-black text-white leading-none mb-4 group-hover:scale-105 transition-transform duration-300">
              10M+
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping" />
              Real-time Active Fleet
            </div>
          </div>

          {/* Cell 5: Stats - Tickets Scanned */}
          <div className="border border-white/5 bg-card/25 backdrop-blur-xl rounded-[32px] p-8 text-center flex flex-col items-center justify-center group hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-15px_rgba(124,58,237,0.12)] transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-3">Tickets Scanned</p>
            <h4 className="text-5xl font-black text-white leading-none mb-4 group-hover:scale-105 transition-transform duration-300">
              1.5M+
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Secure Encrypted scans
            </div>
          </div>


          {/* Deep-Dive Features Grid (3 Columns) */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {[
              {
                icon: WifiOff,
                title: "Offline Scanning Mode",
                desc: "Keep checking in guests even if WiFi fails. All data is securely cached locally and auto-syncs when online.",
                color: "text-amber-400 bg-amber-500/5 border-amber-500/10",
              },
              {
                icon: RefreshCw,
                title: "Multi-Device Live Sync",
                desc: "Connect unlimited smartphones and check-in tablets. Live synchronization prevents double ticket entries.",
                color: "text-cyan-400 bg-cyan-500/5 border-cyan-500/10",
              },
              {
                icon: BarChart3,
                title: "Real-time Reports",
                desc: "Monitor attendance curves, scan timelines, no-shows, and revenue statistics on a unified live dashboard.",
                color: "text-purple-400 bg-purple-500/5 border-purple-500/10",
              },
              {
                icon: Layers,
                title: "Integrated Guest CRM",
                desc: "Build a persistent guest database, tag important VIP clients, and track individual attendance histories.",
                color: "text-pink-400 bg-pink-500/5 border-pink-500/10",
              },
            ].map((feat) => (
              <div key={feat.title} className="border border-white/5 bg-card/15 rounded-2xl p-6 hover:border-purple-500/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg mb-4 border ${feat.color}`}>
                  <feat.icon className="h-5 w-5" />
                </div>
                <h4 className="text-white font-bold uppercase tracking-tight text-sm mb-2">{feat.title}</h4>
                <p className="text-xs text-white/50 leading-relaxed font-medium">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: The Event Lifecycle (Chronological Journey) */}
      <section className="relative z-10 border-t border-white/5 bg-black/30 backdrop-blur-3xl py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-purple-400 italic mb-6">
              <Sliders className="h-3.5 w-3.5" />
              Event Operations Flow
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
              How Events Hub <span className="text-brand-gradient">Works</span>
            </h2>
            <p className="mt-4 text-base text-white/60 leading-relaxed font-medium">
              From the initial ticket release to doors closing, discover the seamless timeline of organizing events on our network.
            </p>
          </div>

          <EventLifecycleJourney />
        </div>
      </section>

      {/* Section 2: Live Dashboard & Real-Time Analytics */}
      <section className="relative z-10 border-t border-white/5 bg-[#0a0c16]/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Copy */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-400 italic">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                Live Command Center
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                Real-Time Gate <br/>
                <span className="text-brand-gradient">Control & Metrics</span>
              </h2>
              <p className="text-white/70 leading-relaxed font-medium text-sm sm:text-base">
                Get full operational transparency. Monitor entry velocity, sync multi-gate staff scanners instantly, track VIP arrivals, and prevent duplicate check-ins through a live dashboard feed.
              </p>
              <ul className="space-y-3.5 text-left inline-block lg:block">
                {[
                  "Live scan speed counters (scans/min)",
                  "Automatic sync across all active gates",
                  "VIP alert notifications and check-in logs",
                  "Comprehensive attendance curve analytics",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-white/80 font-bold">
                    <Check className="h-4.5 w-4.5 text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Simulated Interactive Dashboard */}
            <div className="lg:col-span-7">
              <LiveDashboardPreview />
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Device Pairing & Staff Scanning */}
      <section className="relative z-10 border-t border-white/5 bg-black/30 backdrop-blur-3xl py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Interactive QR Scanner Simulator */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <DevicePairingShowcase />
            </div>

            {/* Right: Copy */}
            <div className="lg:col-span-5 order-1 lg:order-2 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-pink-400 italic">
                <Smartphone className="h-3.5 w-3.5" />
                Zero App-Store Friction
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                Pair Staff Phones <br/>
                <span className="text-brand-gradient">In Seconds</span>
              </h2>
              <p className="text-white/70 leading-relaxed font-medium text-sm sm:text-base">
                No app downloads required for volunteer staff. Simply display your event's pairing QR code from the organizer panel, scan it with any smartphone camera, and instantly launch a secure check-in terminal.
              </p>
              <ul className="space-y-3.5 text-left inline-block lg:block">
                {[
                  "No app store accounts or logins required",
                  "Encrypted device-pairing tokens",
                  "Individual gate assignment profiles",
                  "Instant staff scanner permission revoking",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-white/80 font-bold">
                    <Check className="h-4.5 w-4.5 text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Section 4: Premium Pricing & Plan Feature Grid */}
      <section className="relative z-10 border-t border-white/5 bg-[#0a0c16]/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-amber-400 italic mb-6">
              <Shield className="h-3.5 w-3.5" />
              Flexible Event Tiers
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
              Fair, Scale-Driven <span className="text-brand-gradient">Pricing</span>
            </h2>
            <p className="mt-4 text-base text-white/60 leading-relaxed font-medium">
              Start completely free for your first 50 check-ins. Upgrade as your ticket sales and check-in volumes grow.
            </p>
          </div>

          <PricingAndFeatures />
        </div>
      </section>

      {/* Full Width Footer CTA Section */}
      <section className="relative z-10 border-t border-white/5 bg-gradient-to-b from-black/20 to-black/80 py-24">
        <div className="max-w-5xl mx-auto px-4 text-center relative overflow-hidden group rounded-[32px] border border-white/5 bg-card/10 backdrop-blur-xl p-12 md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(124,77,255,0.06),transparent_80%)] pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
              Elevate Your <span className="text-brand-gradient">Events Today</span>
            </h3>
            <p className="text-white/60 max-w-xl mx-auto font-medium text-sm sm:text-base">
              Join thousands of organizers running flawless registration, ticketing, and check-ins on the OneStone Ads network. Let's make your next gate experience painless.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] hover:shadow-[0_6px_30px_0_rgba(124,77,255,0.55)] bg-brand-gradient hover:opacity-95 text-white border-0 font-bold rounded-full px-8 py-6">
                <Link href="/signup">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full font-bold px-8 py-6">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ─────────── Interactive Demo: Check-in App ─────────── */
function CheckInAppDemo() {
  const [guests, setGuests] = useState([
    { id: 1, name: "Sarah Connor", ticket: "VIP Pass", status: "checked-in", time: "10:04 AM" },
    { id: 2, name: "John Connor", ticket: "Standard", status: "pending", time: "" },
    { id: 3, name: "T-800", ticket: "General", status: "pending", time: "" },
  ]);
  const [scanningId, setScanningId] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  const checkedInCount = guests.filter((g) => g.status === "checked-in").length;

  const handleCheckIn = (id: number) => {
    setScanningId(id);
    // Simulate scanner delay
    setTimeout(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 250);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setGuests((prev) =>
        prev.map((g) =>
          g.id === id ? { ...g, status: "checked-in", time: timeStr } : g
        )
      );
      setScanningId(null);
    }, 900);
  };

  return (
    <div className="space-y-4">
      {/* Camera feed/scan scanner viewport simulation */}
      <div className="relative h-28 bg-black/60 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center justify-center">
        {/* Viewport corner guides */}
        <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-blue-400" />
        <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t border-r border-blue-400" />
        <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b border-l border-blue-400" />
        <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b border-r border-blue-400" />

        {scanningId ? (
          <div className="text-center space-y-1.5 relative z-10">
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-400 animate-pulse">Scanning Pass...</div>
            <div className="text-xs font-bold text-white/95 uppercase">{guests.find(g => g.id === scanningId)?.name}</div>
            <div className="w-20 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="w-full h-full bg-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="text-center space-y-1 relative z-10">
            <ScanLine className="h-6 w-6 text-white/20 mx-auto animate-pulse" />
            <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Camera Viewfinder Active</div>
          </div>
        )}

        {/* Animated Laser beam line */}
        {scanningId && (
          <motion.div
            animate={{ y: [-48, 48, -48] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)]"
          />
        )}

        {/* Flash Verification feedback */}
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center"
          >
            <div className="text-[11px] font-black uppercase tracking-widest text-black">PASS VERIFIED ✓</div>
          </motion.div>
        )}
      </div>

      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Live Guest List</span>
        <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/15">
          {checkedInCount} / {guests.length} IN
        </span>
      </div>

      <div className="space-y-2">
        {guests.map((g) => (
          <div key={g.id} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div>
              <p className="text-xs font-bold text-white">{g.name}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{g.ticket}</p>
            </div>
            {g.status === "checked-in" ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-white/40">{g.time}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30 text-green-400">
                  <Check className="h-3 w-3" />
                </span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => handleCheckIn(g.id)}
                disabled={scanningId !== null}
                className="h-7 text-[10px] px-3.5 font-bold bg-blue-500 hover:bg-blue-400 text-white rounded-lg border-0 shadow-lg shadow-blue-500/10"
              >
                Scan In
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="text-[9px] text-white/30 border-t border-white/5 pt-2.5 flex items-center gap-1.5 italic justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
        Offline mode active - auto-syncing in background
      </div>
    </div>
  );
}

/* ─────────── Interactive Demo: Ticket Designer ─────────── */
function TicketDesignerDemo() {
  const themes = [
    { name: "Stone Dark", bg: "from-[#0c0e1a] to-[#04050a]", border: "border-white/10 hover:border-blue-500/30", text: "text-white", accent: "text-blue-400", hex: "#0f172a" },
    { name: "OneStone Purple", bg: "from-[#1e1145] to-[#0b031c]", border: "border-purple-500/20 hover:border-pink-500/30", text: "text-white", accent: "text-pink-400", hex: "#2e1065" },
    { name: "Emerald Club", bg: "from-[#063327] to-[#01140f]", border: "border-emerald-500/20 hover:border-amber-500/30", text: "text-white", accent: "text-amber-400", hex: "#064e3b" },
  ];
  const [activeTheme, setActiveTheme] = useState(themes[1]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    x.set(mouseX);
    y.set(mouseY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div className="space-y-4">
      {/* 3D Tilting Ticket Design Preview */}
      <div className="[perspective:800px]">
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className={`p-5 rounded-2xl border ${activeTheme.border} bg-gradient-to-br ${activeTheme.bg} shadow-2xl relative overflow-hidden transition-all duration-300 group/designer cursor-pointer`}
        >
          {/* Iridescent shimmer shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/designer:translate-x-full transition-transform duration-[1500ms] pointer-events-none" />

          <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-4" style={{ transform: "translateZ(15px)" }}>
            <div>
              <span className="text-[7px] font-black tracking-[0.25em] text-white/50 uppercase">Access Pass</span>
              <h5 className="text-xs font-black uppercase text-white mt-0.5">Gulf Gala Dinner</h5>
            </div>
            <span className="text-[8px] font-black text-white bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">VIP</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4" style={{ transform: "translateZ(10px)" }}>
            <div>
              <div className="text-[7px] font-bold text-white/40 uppercase tracking-widest">GUEST</div>
              <div className="text-[10px] text-white font-black uppercase tracking-tight mt-0.5">John Doe</div>
            </div>
            <div>
              <div className="text-[7px] font-bold text-white/40 uppercase tracking-widest">DATE</div>
              <div className="text-[10px] text-white font-black tracking-tight mt-0.5"><span className={activeTheme.accent}>2026-06-25</span></div>
            </div>
          </div>

          <div className="flex justify-center border-t border-dashed border-white/20 pt-4 relative" style={{ transform: "translateZ(15px)" }}>
            {/* Ticket side-notches cutouts */}
            <div className="absolute -left-[26px] top-2 h-4 w-4 bg-[#080911] rounded-full border-r border-white/10 z-10" />
            <div className="absolute -right-[26px] top-2 h-4 w-4 bg-[#080911] rounded-full border-l border-white/10 z-10" />
            
            <div className="flex flex-col items-center gap-1.5">
              <QrCode className={`h-11 w-11 ${activeTheme.accent} opacity-90 drop-shadow-[0_0_4px_currentColor]`} />
              <span className="text-[7px] font-mono text-white/30 tracking-wider">CODE: 100084322</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Theme Selection dots */}
      <div className="flex gap-3 justify-center items-center">
        {themes.map((t) => (
          <button
            key={t.name}
            onClick={() => setActiveTheme(t)}
            className={`h-5 w-5 rounded-full border transition-all ${
              activeTheme.name === t.name ? "scale-125 border-white ring-2 ring-purple-500/20" : "border-transparent"
            }`}
            style={{ backgroundColor: t.hex }}
            title={t.name}
          />
        ))}
      </div>
      <p className="text-[9px] text-center text-white/40 font-bold uppercase tracking-wider">Select Branded Theme</p>
    </div>
  );
}

/* ─────────── Interactive Demo: Checkout Calculator ─────────── */
function CheckoutDemo() {
  const [qty, setQty] = useState(1);
  const price = 15;
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
    }, 1400);
  };

  return (
    <div className="bg-[#0c0e17] border border-white/10 rounded-2xl p-4 space-y-4">
      
      {/* Credit Card payment simulation overlay */}
      <div className="relative w-full h-28 rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between overflow-hidden shadow-inner group">
        {/* Spotlight card reflection shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] pointer-events-none" />

        {/* Chip & Logo */}
        <div className="flex justify-between items-start">
          {/* Card chip */}
          <div className="w-7 h-5 bg-gradient-to-br from-yellow-500 to-amber-300 rounded border border-yellow-600/30 p-1 flex flex-col justify-between">
            <div className="border-b border-yellow-800/20 h-[1px] w-full" />
            <div className="border-b border-yellow-800/20 h-[1px] w-full" />
          </div>
          
          <div className="flex items-center gap-1.5">
            <BrandMark className="h-4.5 w-4.5 text-white/70" />
            <span className="text-[8px] font-black uppercase text-white/55 tracking-wider">OneStone</span>
          </div>
        </div>

        {/* Card Number */}
        <div className="font-mono text-xs text-white/70 tracking-widest mt-1">
          ••••   ••••   ••••   4827
        </div>

        {/* Card Holder & Expiry */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[6px] text-white/30 uppercase tracking-widest leading-none">Card Holder</div>
            <div className="text-[9px] font-black text-white/75 uppercase mt-0.5 leading-none">Alex Rivera</div>
          </div>
          <div className="text-right">
            <div className="text-[6px] text-white/30 uppercase tracking-widest leading-none">Expiry</div>
            <div className="text-[9px] font-bold text-white/75 mt-0.5 leading-none">08/29</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start border-t border-white/5 pt-2.5">
        <div>
          <h5 className="text-xs font-bold text-white uppercase">Gala Dinner Booking</h5>
          <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Single Entry Ticket</p>
        </div>
        <span className="text-xs font-black text-pink-400">BHD {price.toFixed(3)}</span>
      </div>

      {paid ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-500/10 border border-green-500/20 text-green-400 text-center py-4 rounded-xl flex flex-col items-center gap-1.5"
        >
          <CheckCircle2 className="h-6 w-6 text-green-400" />
          <div>
            <p className="text-xs font-bold">Booking Confirmed!</p>
            <p className="text-[9px] text-green-400/70 uppercase mt-0.5">Tickets Sent to Email</p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Quantity Selector */}
          <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl border border-white/5">
            <span className="text-xs text-white/60 font-bold">Passes</span>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="h-6 w-6 rounded-md bg-white/10 hover:bg-white/20 border-0 text-white"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs font-bold text-white w-4 text-center">{qty}</span>
              <Button
                size="icon"
                onClick={() => setQty(qty + 1)}
                className="h-6 w-6 rounded-md bg-white/10 hover:bg-white/20 border-0 text-white"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="flex justify-between items-center border-t border-white/5 pt-3">
            <span className="text-xs text-white/40 uppercase font-black tracking-wider">Total</span>
            <span className="text-sm font-black text-white">BHD {(qty * price).toFixed(3)}</span>
          </div>

          <Button
            onClick={handlePay}
            disabled={loading}
            className="w-full h-9 bg-brand-gradient hover:opacity-95 text-white font-bold text-xs rounded-xl border-0 shadow-lg shadow-purple-500/10"
          >
            {loading ? "Processing Securely..." : "Buy Ticket"}
          </Button>
        </>
      )}
    </div>
  );
}

/* ─────────── Interactive Demo: Event Lifecycle Journey ─────────── */
function EventLifecycleJourney() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Tab 1 state (Reg Fields Toggles)
  const [fields, setFields] = useState({
    dietary: true,
    company: false,
    jobTitle: true,
  });

  // Tab 2 state (Email Campaign Simulation)
  const [sendingState, setSendingState] = useState<"idle" | "sending" | "done">("idle");
  const [sendProgress, setSendProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  // Tab 4 state (Selected gate filter)
  const [activeGate, setActiveGate] = useState("all");

  const startEmailSimulation = () => {
    if (sendingState === "sending") return;
    setSendingState("sending");
    setSendProgress(0);
    setSentCount(0);
  };

  useEffect(() => {
    if (sendingState !== "sending") return;
    const interval = setInterval(() => {
      setSendProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setSendingState("done");
          return 100;
        }
        return p + 4;
      });
      setSentCount((c) => Math.min(1248, c + 50));
    }, 80);
    return () => clearInterval(interval);
  }, [sendingState]);

  const tabs = [
    {
      label: "1. Setup Registration",
      icon: Globe,
      title: "Custom Reg Forms & Pricing Tiers",
      desc: "Configure ticket classes (VIP, General, Staff) and build tailored questionnaires to gather exactly what you need from attendees.",
      bullets: [
        "Create custom dropdowns and text inputs",
        "Enable ticket quantity limits and dates",
        "Support local currency payments securely",
      ]
    },
    {
      label: "2. Design & Broadcast",
      icon: Mail,
      title: "Studio Designer & Email Delivery",
      desc: "Design glowing ticket layouts in the Ticket Studio and broadcast them automatically to confirmed guests via built-in mail campaigns.",
      bullets: [
        "Include unique verification QR codes",
        "Distribute direct-to-inbox PDF passes",
        "Track delivery, bounces, and opens in real-time",
      ]
    },
    {
      label: "3. Pair Staff Devices",
      icon: Smartphone,
      title: "On-Door Scanner Pairing",
      desc: "Instantly link staff phones via a single QR code. Turn volunteer smartphones into secure ticket validation terminals.",
      bullets: [
        "Pair devices instantly without app store logins",
        "Allocate specific scanners to specific entrance gates",
        "Revoke terminal credentials instantly if needed",
      ]
    },
    {
      label: "4. Live gate Reports",
      icon: TrendingUp,
      title: "Real-Time Entry Analytics",
      desc: "Monitor check-in charts, occupancy status, gate check-in speeds, and cross-reference guest profiles live.",
      bullets: [
        "See entrance logs split by gates",
        "Download attendance CSVs instantly",
        "Trace VIP no-shows and active fleet counts",
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
      {/* Left Column: Tab Selectors & Info */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex flex-col gap-2 bg-[#0c0e17] border border-white/5 p-2 rounded-2xl">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left font-bold transition-all ${
                activeTab === idx
                  ? "bg-purple-600/15 border border-purple-500/20 text-white"
                  : "border border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.02]"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeTab === idx ? "text-purple-400" : "text-white/40"}`} />
              <span className="text-sm tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 bg-white/[0.01] border border-white/5 p-6 rounded-[24px]">
          <h3 className="text-xl font-black uppercase text-white tracking-tight">{tabs[activeTab].title}</h3>
          <p className="text-white/60 text-sm leading-relaxed font-medium">{tabs[activeTab].desc}</p>
          <div className="space-y-2 pt-2">
            {tabs[activeTab].bullets.map((b) => (
              <div key={b} className="flex items-center gap-2 text-xs font-semibold text-white/80">
                <Check className="h-4 w-4 text-purple-400" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Visual Simulator Card */}
      <div className="lg:col-span-7 bg-[#0c0e17] border border-white/10 p-6 md:p-8 rounded-[32px] shadow-2xl relative min-h-[360px] flex flex-col justify-center overflow-hidden">
        {/* Shimmer light */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(124,77,255,0.03),transparent_60%)] pointer-events-none" />

        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="tab-0-setup"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs font-black uppercase text-white/40 tracking-wider">Form Editor Mockup</span>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Controls */}
                <div className="space-y-3.5 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Registration Fields</div>
                  {Object.entries(fields).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setFields((prev) => ({ ...prev, [key]: !val }))}
                      className="flex items-center justify-between w-full p-2.5 rounded-lg bg-[#080911] border border-white/5 text-left hover:border-purple-500/30 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-white/80 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className={`h-4.5 w-8 rounded-full transition-colors flex items-center p-0.5 ${val ? 'bg-purple-600 justify-end' : 'bg-white/10 justify-start'}`}>
                        <span className="h-3.5 w-3.5 rounded-full bg-white shadow-md" />
                      </span>
                    </button>
                  ))}
                </div>
                {/* Live Preview */}
                <div className="space-y-4 bg-white/[0.04] p-5 rounded-xl border border-white/10 shadow-inner">
                  <div className="text-[9px] font-black uppercase tracking-widest text-purple-400 leading-none">Live Form Preview</div>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="text-[8px] font-bold text-white/50 uppercase">Full Name</div>
                      <div className="h-7 bg-[#080911] rounded border border-white/5 px-2.5 text-[10px] text-white/30 flex items-center font-mono">John Doe</div>
                    </div>
                    {fields.company && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                        <div className="text-[8px] font-bold text-white/50 uppercase">Company</div>
                        <div className="h-7 bg-[#080911] rounded border border-white/5 px-2.5 text-[10px] text-white/30 flex items-center font-mono">OneStone Corp</div>
                      </motion.div>
                    )}
                    {fields.jobTitle && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                        <div className="text-[8px] font-bold text-white/50 uppercase">Job Title</div>
                        <div className="h-7 bg-[#080911] rounded border border-white/5 px-2.5 text-[10px] text-white/30 flex items-center font-mono">Event Director</div>
                      </motion.div>
                    )}
                    {fields.dietary && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                        <div className="text-[8px] font-bold text-white/50 uppercase">Dietary Requirements</div>
                        <div className="h-7 bg-[#080911] rounded border border-white/5 px-2.5 text-[10px] text-white/30 flex items-center font-mono">None / Vegetarian</div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="tab-1-email"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs font-black uppercase text-white/40 tracking-wider">Email Broadcast Panel</span>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded">Ready</span>
              </div>
              <div className="space-y-4 max-w-md mx-auto bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                <div className="flex justify-between items-center text-xs font-bold text-white/80">
                  <span>Send Ticket Campaign</span>
                  <span className="text-[10px] text-white/45">To: 1,248 Recipients</span>
                </div>
                {sendingState === "idle" && (
                  <Button onClick={startEmailSimulation} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-xl border-0 shadow-lg shadow-purple-500/10 text-xs">
                    Trigger Dispatch
                  </Button>
                )}
                {sendingState === "sending" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-purple-400">
                      <span>Sending: {sendProgress}%</span>
                      <span>{sentCount} / 1248 Sent</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-purple-500 transition-all duration-75" style={{ width: `${sendProgress}%` }} />
                    </div>
                  </div>
                )}
                {sendingState === "done" && (
                  <div className="space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-400 text-xs font-bold bg-green-500/15 border border-green-500/20 py-2.5 rounded-xl">
                      <CheckCircle className="h-4.5 w-4.5" />
                      All Tickets Delivered Successfully!
                    </div>
                    <Button onClick={() => setSendingState("idle")} variant="ghost" className="text-white/40 hover:text-white/70 text-[10px] font-bold tracking-wider uppercase p-0 h-6">
                      Reset Simulation
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="tab-2-pair"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs font-black uppercase text-white/40 tracking-wider">Device Admin Console</span>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded">Secure</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <h4 className="text-white font-bold text-sm leading-tight">Link Volunteer Scanning Devices</h4>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">
                    Invite check-in staff to pair their smartphones by directing their default cameras to this secure temporary pairing token.
                  </p>
                  <div className="bg-[#080911] border border-white/5 p-3.5 rounded-xl font-mono text-[11px] text-center text-purple-400 tracking-wider">
                    TOKEN: EH-890-ZFX
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white p-3.5 rounded-2xl border-4 border-purple-500/30 shadow-[0_0_20px_rgba(124,77,255,0.15)]">
                    <QrCode className="h-28 w-28 text-black" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div
              key="tab-3-reports"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs font-black uppercase text-white/40 tracking-wider">Live Gate Activity Split</span>
                <div className="flex gap-2">
                  {["all", "A", "B"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setActiveGate(g)}
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border transition-colors ${
                        activeGate === g ? 'bg-purple-600/20 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
                      }`}
                    >
                      {g === 'all' ? 'All Gates' : `Gate ${g}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3.5">
                {[
                  { name: "Main Entrance (Gate A)", rate: 72, total: 412, limit: 500, active: true },
                  { name: "VIP Lounge (Gate B)", rate: 12, total: 96, limit: 150, active: true },
                  { name: "Staff & Press (Gate C)", rate: 4, total: 48, limit: 100, active: false },
                ]
                  .filter((gate) => activeGate === "all" || gate.name.includes(`Gate ${activeGate}`))
                  .map((gate) => (
                    <div key={gate.name} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{gate.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-purple-400">{gate.rate} scans/min</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${gate.active ? 'bg-green-400 animate-ping' : 'bg-white/20'}`} />
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${(gate.total / gate.limit) * 100}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] font-semibold text-white/40">
                        <span>Total Checked In: {gate.total} / {gate.limit}</span>
                        <span>Capacity: {Math.round((gate.total / gate.limit) * 100)}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────── Interactive Demo: Live Dashboard & Analytics ─────────── */
function LiveDashboardPreview() {
  const [totalCheckedIn, setTotalCheckedIn] = useState(843);
  
  // Feed list state
  const [feed, setFeed] = useState([
    { id: 1, name: "Alice Carter", gate: "Gate A", type: "VIP", time: "10:22:04 AM" },
    { id: 2, name: "Daniel Craig", gate: "Gate B", type: "General", time: "10:21:42 AM" },
    { id: 3, name: "Sarah Jenkins", gate: "Gate A", type: "VIP", time: "10:20:15 AM" },
    { id: 4, name: "Liam Thompson", gate: "Gate A", type: "General", time: "10:19:02 AM" },
  ]);

  const guestPool = [
    { name: "Zara Ahmed", gate: "Gate A", type: "VIP" },
    { name: "Marcus Vance", gate: "Gate B", type: "General" },
    { name: "Yuki Sato", gate: "Gate A", type: "VIP" },
    { name: "Chloe Dupont", gate: "Gate B", type: "General" },
    { name: "Fahad Al-Saud", gate: "Gate A", type: "VIP" },
    { name: "Emma Watson", gate: "Gate A", type: "General" },
    { name: "Rodrigo Gomez", gate: "Gate B", type: "General" },
  ];

  const poolIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Increment total count
      setTotalCheckedIn((c) => c + 1);

      // Add guest to feed
      const nextGuest = guestPool[poolIndex.current];
      poolIndex.current = (poolIndex.current + 1) % guestPool.length;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const newEntry = {
        id: Date.now(),
        name: nextGuest.name,
        gate: nextGuest.gate,
        type: nextGuest.type,
        time: timeStr
      };

      setFeed((prev) => [newEntry, ...prev.slice(0, 3)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0c0e17] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
      
      {/* Top Row: Metrics Bar */}
      <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none block">Total Scans</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tight">{totalCheckedIn}</span>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-ping animate-duration-1000" />
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none block">Gate Speed</span>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-blue-400 tracking-tight">18</span>
            <span className="text-[9px] font-black uppercase text-white/50 tracking-wider">/min</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none block">Paired Devices</span>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-purple-400 tracking-tight">4</span>
            <span className="text-[9px] font-black uppercase text-green-400 tracking-wider">Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Simulated Chart */}
        <div className="space-y-3.5 bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Entry Flow Profile</span>
            <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Live</span>
          </div>
          
          {/* Animated SVG Graph */}
          <div className="h-28 w-full relative mt-2">
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Fill path */}
              <path
                d="M 0,90 Q 30,70 60,80 T 120,40 T 180,15 L 180,95 L 0,95 Z"
                fill="url(#chartGradient)"
              />
              {/* Main Line path */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                d="M 0,90 Q 30,70 60,80 T 120,40 T 180,15"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Grid guide */}
              <line x1="0" y1="95" x2="180" y2="95" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
              {/* Pulsing endpoint */}
              <circle cx="180" cy="15" r="4.5" fill="#db2777" className="animate-pulse" />
            </svg>
          </div>
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/30 pt-1 border-t border-white/5">
            <span>09:00 AM</span>
            <span>10:00 AM</span>
            <span>Live Flow</span>
          </div>
        </div>

        {/* Right: Check-In Feed list */}
        <div className="space-y-3.5 bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col justify-between min-h-[180px]">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1 border-b border-white/5 pb-2">
            Live Check-In Event Ticker
          </div>
          <div className="space-y-2 relative flex-1 overflow-hidden flex flex-col justify-start">
            <AnimatePresence initial={false}>
              {feed.map((guest) => (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex justify-between items-center bg-white/[0.03] border border-white/5 p-2.5 rounded-xl text-left"
                >
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-white leading-none">{guest.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] text-white/40 uppercase tracking-wider">{guest.gate}</span>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded leading-none ${
                        guest.type === "VIP" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                      }`}>
                        {guest.type}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-white/35">{guest.time.split(" ")[0]}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Interactive Demo: Device Pairing Showcase ─────────── */
function DevicePairingShowcase() {
  const [step, setStep] = useState<"idle" | "scanning" | "pairing" | "paired">("idle");
  const [spinnerLabel, setSpinnerLabel] = useState("Verifying authorization token...");

  const runPairing = () => {
    if (step !== "idle") return;
    setStep("scanning");

    setTimeout(() => {
      setStep("pairing");
      setSpinnerLabel("Linking device to Gate A profile...");
      setTimeout(() => {
        setSpinnerLabel("Synchronizing local check-in list...");
        setTimeout(() => {
          setStep("paired");
        }, 1200);
      }, 1200);
    }, 1500);
  };

  const resetPairing = () => {
    setStep("idle");
  };

  return (
    <div className="bg-[#0c0e17] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center space-y-6 w-full">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
        {/* Left Panel: Organizer Dashboard Screen */}
        <div className="bg-black/60 border border-white/10 p-5 rounded-2xl flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-4 bg-white/5 border-b border-white/5 flex items-center px-3 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400/85" />
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/85" />
            <span className="h-1.5 w-1.5 rounded-full bg-green-400/85" />
            <span className="text-[7px] text-white/20 font-mono tracking-widest ml-auto">admin.eventshub.com</span>
          </div>

          <div className="pt-6 space-y-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/55">Device Pairing Code</p>
            <div className="flex justify-center items-center gap-3">
              <div className="bg-white p-2 rounded-xl relative">
                <QrCode className="h-20 w-20 text-black" />
                {step === "scanning" && (
                  <motion.div
                    animate={{ y: [0, 80, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  />
                )}
              </div>
            </div>
            <div className="font-mono text-xs text-purple-400 tracking-wider">EH-982-FX</div>
          </div>
        </div>

        {/* Right Panel: Smartphone Screen Frame */}
        <div className="flex justify-center">
          <div className="relative w-[180px] h-[340px] rounded-[36px] border-[6px] border-white/10 bg-[#080911] shadow-2xl p-3 flex flex-col justify-between overflow-hidden">
            {/* Phone notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-white/10 rounded-b-xl z-20" />
            
            {step === "idle" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 pt-4">
                <Smartphone className="h-14 w-14 text-white/25 animate-bounce animate-duration-1000" />
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-white/80 leading-none">Unlinked Device</div>
                  <p className="text-[8px] text-white/40 leading-relaxed max-w-[120px] mx-auto">Click pair below to trigger simulated staff setup.</p>
                </div>
                <Button onClick={runPairing} className="h-7 text-[9px] font-black uppercase tracking-wider px-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg border-0 shadow-lg shadow-purple-500/10">
                  Simulate Pair
                </Button>
              </div>
            )}

            {step === "scanning" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-4 relative">
                {/* Simulated viewfinder */}
                <div className="w-24 h-24 border border-white/20 rounded-xl relative overflow-hidden flex items-center justify-center bg-black/40">
                  <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-purple-400" />
                  <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-purple-400" />
                  <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-purple-400" />
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-purple-400" />
                  <QrCode className="h-10 w-10 text-white/20 animate-pulse animate-duration-1000" />
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-wider text-purple-400 animate-pulse animate-duration-1000">Aligning QR Code...</div>
                  <p className="text-[7px] text-white/30 leading-none">Accessing default camera</p>
                </div>
              </div>
            )}

            {step === "pairing" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-4">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin animate-duration-1000" />
                <div className="space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-wider text-purple-400">Verifying...</div>
                  <p className="text-[8px] text-white/50 leading-tight max-w-[120px] mx-auto">{spinnerLabel}</p>
                </div>
              </div>
            )}

            {step === "paired" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-5 pt-4">
                <CheckCircle className="h-12 w-12 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.2)]" />
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-green-400 leading-none">Device Linked!</div>
                  <div className="text-[8px] text-white/50 tracking-wider">Gate A Scanner Profile</div>
                </div>
                <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-left w-full space-y-1">
                  <div className="text-[7px] font-bold text-white/30 uppercase leading-none">Last Scanned Pass</div>
                  <div className="text-[8px] font-black text-white/80 leading-none">VIP Check-In (Pending scan)</div>
                </div>
                <Button onClick={resetPairing} variant="ghost" className="text-white/30 hover:text-white/60 text-[8px] font-bold tracking-wider uppercase h-6 p-0">
                  Disconnect Device
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Interactive Demo: Pricing & Features ─────────── */
function PricingAndFeatures() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      name: "Seed / Free",
      priceMonthly: 0,
      priceYearly: 0,
      desc: "Perfect for local meetups, private gatherings, and casual events.",
      features: [
        "Landing pages for single events",
        "Up to 50 checked-in guests",
        "Standard Ticket Studio access",
        "Self-service support channel",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Growth / Pro",
      priceMonthly: 25,
      priceYearly: 19,
      desc: "For professional creators, clubs, and growing event organizers.",
      features: [
        "Unlimited events & tickets sales",
        "Custom checkout question builder",
        "Offline-first staff check-in app",
        "Apple Wallet (.pkpass) exports",
        "Prioritized support (under 2 hrs)",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      name: "Enterprise / Custom",
      priceMonthly: 99,
      priceYearly: 79,
      desc: "Built for massive festivals, conferences, and custom setups.",
      features: [
        "White-label custom booking domains",
        "Direct API endpoints & webhooks",
        "Dedicated Account Manager support",
        "Enterprise network SLA guarantees",
        "Custom contract agreements",
      ],
      cta: "Contact Enterprise",
      popular: false,
    },
  ];

  // Full Feature Table
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="space-y-12">
      {/* Billing Switcher Toggle */}
      <div className="flex justify-center items-center gap-4">
        <span className={`text-xs font-bold transition-colors ${billingPeriod === 'monthly' ? 'text-white' : 'text-white/45'}`}>Billed Monthly</span>
        <button
          onClick={() => setBillingPeriod((p) => p === 'monthly' ? 'yearly' : 'monthly')}
          className="w-14 h-8 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-start transition-colors relative cursor-pointer"
        >
          <motion.div
            layout
            className="h-5.5 w-5.5 rounded-full bg-purple-500 shadow-md"
            style={{
              x: billingPeriod === 'yearly' ? 22 : 0
            }}
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold transition-colors ${billingPeriod === 'yearly' ? 'text-white' : 'text-white/45'}`}>Billed Annually</span>
          <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Save 20%</span>
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`border rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 group hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-15px_rgba(124,77,255,0.14)] ${
              p.popular
                ? "border-purple-500 bg-purple-500/[0.02]"
                : "border-white/5 bg-card/25 backdrop-blur-xl hover:border-purple-500/30"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            {p.popular && (
              <div className="absolute top-4 right-4 bg-purple-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                Most Popular
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black uppercase text-white tracking-tight leading-none mb-2">{p.name}</h3>
                <p className="text-xs text-white/50 leading-relaxed font-medium min-h-[36px]">{p.desc}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white">BHD</span>
                <span className="text-5xl font-black text-white tracking-tight">
                  {billingPeriod === 'yearly' ? p.priceYearly : p.priceMonthly}
                </span>
                <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider">/month</span>
              </div>

              <hr className="border-white/5" />

              <ul className="space-y-3.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-white/70 font-semibold leading-tight font-sans">
                    <Check className="h-4.5 w-4.5 text-purple-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <Button
                asChild
                className={`w-full py-5 text-xs font-black uppercase tracking-wider rounded-xl border-0 transition-all ${
                  p.popular
                    ? "bg-brand-gradient text-white shadow-[0_4px_24px_rgba(124,77,255,0.3)] hover:opacity-95"
                    : "bg-white/5 hover:bg-white/10 text-white"
                }`}
              >
                <Link href={p.cta.includes("Contact") ? "/contact" : "/signup"}>{p.cta}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Accordion Feature Comparison */}
      <div className="max-w-2xl mx-auto text-center">
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors p-2"
        >
          {detailsOpen ? "Collapse Full Feature Matrix" : "View Full Feature Matrix"}
          {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {detailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-6 text-left"
            >
              <div className="bg-[#0c0e17] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                {[
                  { section: "Ticketing & Design", items: [
                    { name: "Dynamic QR Ticket Generation", free: true, pro: true, ent: true },
                    { name: "Apple Wallet Integration (.pkpass)", free: false, pro: true, ent: true },
                    { name: "Iridescent and Premium Templates", free: false, pro: true, ent: true },
                    { name: "Bulk PDF Ticket Exporting", free: true, pro: true, ent: true }
                  ]},
                  { section: "On-Site Check-In Operations", items: [
                    { name: "Live Camera-Scan App Link", free: true, pro: true, ent: true },
                    { name: "Offline Check-in Caching", free: false, pro: true, ent: true },
                    { name: "Paired Staff Scanner Terminals", free: 1, pro: "Unlimited", ent: "Unlimited" },
                    { name: "Multi-Gate Operations Sync", free: false, pro: true, ent: true }
                  ]},
                  { section: "Integrations & Customization", items: [
                    { name: "Stripe Payment Gateway integration", free: true, pro: true, ent: true },
                    { name: "Custom Domain Booking Page", free: false, pro: false, ent: true },
                    { name: "Webhooks & API Access", free: false, pro: false, ent: true },
                    { name: "White-labeled Ticket Branding", free: false, pro: false, ent: true }
                  ]}
                ].map((sec) => (
                  <div key={sec.section} className="p-4 space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-400">{sec.section}</div>
                    <div className="space-y-2">
                      {sec.items.map((item) => (
                        <div key={item.name} className="flex justify-between items-center text-xs font-semibold py-1">
                          <span className="text-white/60">{item.name}</span>
                          <div className="flex gap-6 font-mono text-[10px] text-right">
                            <span className="w-14 text-white/40">{typeof item.free === 'boolean' ? (item.free ? '✓' : '—') : item.free}</span>
                            <span className="w-14 text-purple-400">{typeof item.pro === 'boolean' ? (item.pro ? '✓' : '—') : item.pro}</span>
                            <span className="w-14 text-green-400">{typeof item.ent === 'boolean' ? (item.ent ? '✓' : '—') : item.ent}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}



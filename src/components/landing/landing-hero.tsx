"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useMotionTemplate, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Check,
  QrCode,
  Wifi,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/brand-mark";

/** Animated brand-gradient "shiny" text. */
function ShinyText({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block bg-[linear-gradient(110deg,#2563eb,45%,#7c3aed,55%,#db2777)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_6s_linear_infinite] drop-shadow-[0_0_25px_rgba(124,77,255,0.35)]">
      {children}
    </span>
  );
}

/** Count-up number that animates when it scrolls into view. */
function CountUp({ to, suffix = "", duration = 1600 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      setVal(to);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration, reduce]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

const STATS = [
  { value: 4000, suffix: "+", label: "Event organizers" },
  { value: 2, suffix: "M+", label: "Guests checked in" },
  { value: 99, suffix: "%", label: "On-time arrivals" },
];

/** Interactive CSS Ticket Pass with mouse-tracking 3D tilt & glare spotlight */
function InteractiveTicket() {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for tracking mouse cursor position within the card
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map mouse positions to 3D rotation angles
  const rotateX = useTransform(y, [-120, 120], [15, -15]);
  const rotateY = useTransform(x, [-190, 190], [-15, 15]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reduce || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    // Calculate cursor position relative to the card's center
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  }

  function handleMouseLeave() {
    // Reset rotations smoothly
    x.set(0);
    y.set(0);
  }

  // Dynamic spotlight gradient overlay that follows the mouse cursor
  const mouseXPercent = useTransform(x, [-190, 190], ["0%", "100%"]);
  const mouseYPercent = useTransform(y, [-120, 120], ["0%", "100%"]);
  const spotlight = useMotionTemplate`radial-gradient(280px circle at ${mouseXPercent} ${mouseYPercent}, rgba(255, 255, 255, 0.08), transparent 80%)`;

  return (
    <div className="relative w-full max-w-[390px] mx-auto [perspective:1000px] select-none">
      
      {/* Floating Badges */}
      <motion.div
        animate={reduce ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-6 -left-8 z-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-[0_8px_32px_0_rgba(16,185,129,0.15)]"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        Scan Success 100%
      </motion.div>

      <motion.div
        animate={reduce ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-4 -right-6 z-20 bg-blue-500/10 border border-blue-500/20 text-blue-400 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-[0_8px_32px_0_rgba(59,130,246,0.15)]"
      >
        <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
        Syncing 24 Devices
      </motion.div>

      <motion.div
        animate={reduce ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-24 -right-10 z-20 bg-purple-500/10 border border-purple-500/20 text-purple-400 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-[0_8px_32px_0_rgba(139,92,246,0.15)]"
      >
        <Wifi className="h-4 w-4 text-purple-400" />
        Offline-First Ready
      </motion.div>

      {/* Main Ticket Card Wrapper */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={reduce ? {} : {
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full aspect-[1.58] rounded-[24px] border border-white/10 bg-gradient-to-br from-[#0c0e1c] to-[#04050a] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.85)] transition-colors duration-300 hover:border-purple-500/30 overflow-hidden cursor-pointer group"
      >
        {/* Spotlight dynamic reflection */}
        {!reduce && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ background: spotlight }}
          />
        )}

        {/* Fine grid/circuit line texture backing */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.015)_25%,rgba(255,255,255,0.015)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.015)_75%)] bg-[length:20px_20px] opacity-70 pointer-events-none" />

        {/* Soft internal gradient orb */}
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-purple-600/10 blur-xl pointer-events-none" />

        {/* Ticket Notch Cutouts */}
        <div className="absolute w-4 h-8 bg-[#080911] rounded-r-full -left-[1px] top-1/2 -translate-y-1/2 border-r border-t border-b border-white/10 z-10" />
        <div className="absolute w-4 h-8 bg-[#080911] rounded-l-full -right-[1px] top-1/2 -translate-y-1/2 border-l border-t border-b border-white/10 z-10" />

        {/* Card Content Layout */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between" style={{ transform: "translateZ(30px)" }}>
          
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandMark className="h-7 w-7 text-white" />
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-tight text-white leading-none">Events Hub</span>
                <span className="text-[7px] font-black uppercase tracking-[0.15em] text-white/45">OneStone Ads</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-black text-[9px] font-black tracking-widest px-2.5 py-1 rounded uppercase shadow-[0_2px_10px_rgba(234,179,8,0.2)]">
              VIP PASS
            </div>
          </div>

          {/* Body Row */}
          <div className="flex items-end justify-between my-2">
            <div className="space-y-3">
              <div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-white/40">TICKET HOLDER</div>
                <div className="text-base font-black uppercase text-white tracking-tight leading-none mt-0.5">ALEX RIVERA</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-white/40">ACCESS LEVEL</div>
                  <div className="text-xs font-black uppercase text-brand-gradient tracking-tight mt-0.5">ALL AREAS</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-white/40">SECTION</div>
                  <div className="text-xs font-bold uppercase text-white/80 tracking-tight mt-0.5">MAIN DECK</div>
                </div>
              </div>
            </div>

            {/* Glowing Neon Cyan QR Code Mockup */}
            <div className="w-16 h-16 bg-black/45 border border-[#00f0ff]/20 rounded-xl p-2 flex items-center justify-center relative overflow-hidden group-hover:border-[#00f0ff]/40 transition-colors duration-300">
              <div className="absolute inset-0 bg-[#00f0ff]/5 blur-md pointer-events-none" />
              <QrCode className="w-full h-full text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]" />
            </div>
          </div>

          {/* Divider Dot Line */}
          <div className="border-t border-dashed border-white/10 w-full my-1.5" />

          {/* Footer Row */}
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/50">
            <div>ONESTONE CONVERGE 2026</div>
            <div className="font-mono text-white/40">No. 0827-01</div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-[95vh] pt-32 pb-16 flex items-center bg-transparent overflow-hidden">
      
      {/* Sleek decorative background orbs to match OneStone Ads colors */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-pink-500/5 blur-[100px] pointer-events-none" />

      {/* Subtle fine layout grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading Copy */}
          <div className="lg:col-span-7 text-center lg:text-left">
            
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white/70 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              A OneStone Platform
            </div>

            <h1 className="text-5xl font-black leading-[0.95] tracking-tighter text-white sm:text-6xl lg:text-6xl xl:text-7xl uppercase">
              <span className="block">Event Hub</span>
              <ShinyText>Your Events Gateway</ShinyText>
            </h1>

            <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-balance text-base leading-relaxed text-white/70 sm:text-lg lg:text-xl font-medium font-sans">
              Design branded passes, register guests, and check them in across
              unlimited devices with a live guest CRM and real-time reports.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button asChild size="lg" className="gap-2 shadow-[0_4px_24px_0_rgba(124,77,255,0.4)] hover:shadow-[0_6px_30px_0_rgba(124,77,255,0.55)] bg-brand-gradient hover:opacity-95 text-white border-0 font-bold rounded-full">
                <Link href="/signup">Start free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full font-bold">
                <Link href="/ticket-studio">View Ticket Studio</Link>
              </Button>
            </div>

            {/* Metrics Row */}
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              {STATS.map((s) => (
                <div key={s.label} className="border-l border-white/10 pl-4 text-left first:border-l-0 first:pl-0">
                  <div className="text-3xl sm:text-4xl font-black text-white leading-none">
                    <CountUp to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-white/45 leading-none">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Premium Showcase (CSS interactive pass) */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            
            {/* Additional glow backplate just for the card */}
            <div className="absolute w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[80px] pointer-events-none -z-10" />
            
            <InteractiveTicket />

          </div>

        </div>
      </div>

    </section>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------------
 * ReactBits-style micro-interactions (reactbits.dev patterns, implemented
 * locally): CountUp, Spotlight, StarBorder, Reveal.
 * ------------------------------------------------------------------------- */

/** Animated number that counts up when it scrolls into view. */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 1400,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) {
      setDisplay(value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          // easeOutCubic — fast start, gentle landing.
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    // Safety net for hidden/throttled tabs (IO + rAF both pause): snap to the
    // final value rather than showing 0 forever.
    const failsafe = setTimeout(() => setDisplay(value), duration + 2500);
    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/** Card wrapper with a mouse-tracking radial highlight (SpotlightCard). */
export function Spotlight({
  children,
  className,
  color = "rgba(56,189,248,0.14)",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={ref}
      onMouseMove={(mouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${mouseEvent.clientX - rect.left}px`);
        el.style.setProperty("--spot-y", `${mouseEvent.clientY - rect.top}px`);
      }}
      className={cn("group/spot relative", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(280px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}

/** Button/badge wrapper with an orbiting star glow border (StarBorder). */
export function StarBorder({
  children,
  className,
  color = "#67E8F9",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-full p-[1.5px]", className)}>
      <div
        aria-hidden
        className="absolute inset-[-100%] animate-[starOrbit_4.5s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0 340deg, ${color} 356deg, transparent 360deg)`,
        }}
      />
      <div className="relative rounded-full bg-[#0b1224]">{children}</div>
    </div>
  );
}

/** Fade-and-rise reveal when the element scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    // Safety net: IO callbacks pause in hidden/throttled tabs — never leave
    // content invisible; worst case it appears without the animation.
    const failsafe = setTimeout(() => setShown(true), 3000);
    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

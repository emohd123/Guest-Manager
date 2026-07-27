"use client";

import { useEffect, useRef } from "react";

type FallingSparklesProps = {
  /** Sparkle colours, cycled through as particles spawn. */
  colors?: string[];
  /** Particle density per 100k px² of viewport. Lower = sparser. */
  density?: number;
  /** Hard cap on particle count (guards huge monitors). */
  maxParticles?: number;
  /** Multiplier on fall speed. */
  speed?: number;
  /** "lighter" glows on dark pages; "source-over" for light backgrounds. */
  composite?: GlobalCompositeOperation;
  className?: string;
};

type Sparkle = {
  x: number;
  y: number;
  size: number;
  fall: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  twinkleFreq: number;
  twinklePhase: number;
  baseAlpha: number;
  sprite: number;
};

const DEFAULT_COLORS = ["#38BDF8", "#7C3AED", "#E879F9", "#F59E0B", "#FFFFFF"];

/**
 * Builds a glowing 4-point star sprite once per colour, so the render loop is
 * pure drawImage calls — radial gradients per particle per frame are far too
 * expensive at this particle count.
 */
function makeSprite(color: string, size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;

  const mid = size / 2;

  // Soft round glow.
  const glow = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
  glow.addColorStop(0, color);
  glow.addColorStop(0.18, color);
  glow.addColorStop(1, "transparent");
  g.globalAlpha = 0.55;
  g.fillStyle = glow;
  g.beginPath();
  g.arc(mid, mid, mid, 0, Math.PI * 2);
  g.fill();

  // Four-point star: two tapered spikes crossing at the centre.
  g.globalAlpha = 1;
  g.fillStyle = color;
  const spike = mid * 0.92;
  const waist = mid * 0.07;
  g.beginPath();
  g.moveTo(mid, mid - spike);
  g.quadraticCurveTo(mid + waist, mid - waist, mid + spike, mid);
  g.quadraticCurveTo(mid + waist, mid + waist, mid, mid + spike);
  g.quadraticCurveTo(mid - waist, mid + waist, mid - spike, mid);
  g.quadraticCurveTo(mid - waist, mid - waist, mid, mid - spike);
  g.fill();

  // Bright core.
  g.beginPath();
  g.arc(mid, mid, mid * 0.1, 0, Math.PI * 2);
  g.fillStyle = "#FFFFFF";
  g.fill();

  return c;
}

export function FallingSparkles({
  colors = DEFAULT_COLORS,
  density = 8,
  maxParticles = 200,
  speed = 1,
  composite = "lighter",
  className,
}: FallingSparklesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const SPRITE_PX = 64;
    const sprites = colors.map((c) => makeSprite(c, SPRITE_PX));

    let width = 0;
    let height = 0;
    let dpr = 1;
    let sparkles: Sparkle[] = [];
    let raf = 0;
    let running = true;

    const spawn = (initial: boolean): Sparkle => {
      const size = 4 + Math.random() * 12;
      return {
        x: Math.random() * width,
        // On first fill, scatter down the page; afterwards, drop in from above.
        y: initial ? Math.random() * height : -size - Math.random() * height * 0.35,
        size,
        // Bigger sparkles fall faster — cheap depth cue.
        fall: (8 + size * 2.4) * (0.5 + Math.random() * 0.7),
        swayAmp: 6 + Math.random() * 26,
        swayFreq: 0.08 + Math.random() * 0.22,
        swayPhase: Math.random() * Math.PI * 2,
        twinkleFreq: 0.5 + Math.random() * 1.7,
        twinklePhase: Math.random() * Math.PI * 2,
        baseAlpha: 0.3 + Math.random() * 0.5,
        sprite: Math.floor(Math.random() * sprites.length),
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(
        maxParticles,
        Math.round((width * height) / 100_000 * density)
      );
      if (sparkles.length > target) {
        sparkles.length = target;
      } else {
        while (sparkles.length < target) sparkles.push(spawn(true));
      }
    };

    resize();

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = composite;

      for (const s of sparkles) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * s.twinkleFreq + s.twinklePhase);
        const x = s.x + Math.sin(t * s.swayFreq + s.swayPhase) * s.swayAmp;
        ctx.globalAlpha = Math.max(0, s.baseAlpha * twinkle);
        ctx.drawImage(sprites[s.sprite], x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // Reduced motion: paint one static field and stop. No loop, no CPU.
    if (reduceMotion) {
      draw(0);
      const onResizeStatic = () => {
        resize();
        draw(0);
      };
      window.addEventListener("resize", onResizeStatic);
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    let last = performance.now();
    const loop = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't teleport every sparkle on return.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      for (const s of sparkles) {
        s.y += s.fall * speed * dt;
        if (s.y - s.size > height) {
          Object.assign(s, spawn(false));
        }
      }

      draw(t);
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => resize();
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [colors, density, maxParticles, speed, composite]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}

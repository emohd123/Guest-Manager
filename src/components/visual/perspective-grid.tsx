"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type PerspectiveGridProps = {
  /** Line colour. Accepts any CSS colour string; low alpha reads best. */
  color?: string;
  /** Multiplier on scroll speed toward the viewer. */
  speed?: number;
  /** Number of horizontal lines drawn between horizon and bottom edge. */
  lineCount?: number;
  className?: string;
};

const DEFAULT_COLOR = "rgba(103,232,249,0.35)";

/** Fraction of the canvas height where the horizon sits. */
const HORIZON = 0.42;
/** Number of vertical lines fanning out from the vanishing point per side. */
const VERTICAL_LINES = 14;

/**
 * Dependency-free synthwave/tron perspective grid rendered on a 2D canvas.
 * Horizontal lines bunch toward a horizon and scroll toward the viewer on a
 * seamless loop; vertical lines converge on a central vanishing point. Kept
 * intentionally cheap: thin 1px strokes, one pass per frame, no per-line
 * gradients — a single overlay handles the horizon fade.
 */
export function PerspectiveGrid({
  color = DEFAULT_COLOR,
  speed = 1,
  lineCount = 18,
  className,
}: PerspectiveGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    // Continuous phase in [0,1); each unit is one full "row" of forward travel.
    let phase = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /**
     * Maps a perspective depth t in [0,1] (0 = horizon, 1 = bottom edge) to a
     * screen y. Squaring pushes lines together near the horizon and spreads
     * them apart as they approach the viewer, which is what sells the motion.
     */
    const depthToY = (t: number) => {
      const horizonY = height * HORIZON;
      return horizonY + (height - horizonY) * t * t;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const horizonY = height * HORIZON;
      const vanishX = width / 2;

      ctx.lineWidth = 1;
      ctx.strokeStyle = color;

      // Horizontal lines. Each line's depth advances by `phase` so the whole
      // field marches forward; when a line passes t=1 it wraps back to the
      // horizon (fractional index keeps the loop seamless).
      ctx.beginPath();
      for (let i = 0; i < lineCount; i++) {
        const t = ((i + phase) % lineCount) / lineCount;
        const y = depthToY(t);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Vertical lines fan from the vanishing point down to the bottom edge,
      // spread evenly across the bottom so they converge in true perspective.
      ctx.beginPath();
      for (let i = -VERTICAL_LINES; i <= VERTICAL_LINES; i++) {
        const spread = i / VERTICAL_LINES; // -1 .. 1
        const bottomX = vanishX + spread * width;
        ctx.moveTo(vanishX, horizonY);
        ctx.lineTo(bottomX, height);
      }
      ctx.stroke();

      // Horizon fade: wipe out the region above the horizon and soften the
      // lines just below it so the grid dissolves into the background instead
      // of terminating on a hard line.
      const fade = ctx.createLinearGradient(0, 0, 0, height);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(HORIZON, "rgba(0,0,0,1)");
      fade.addColorStop(Math.min(1, HORIZON + 0.12), "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
    };

    resize();
    // Paint one frame synchronously so the grid is never blank on first paint,
    // even if requestAnimationFrame is throttled (e.g. a backgrounded tab).
    draw();

    // Reduced motion: paint one static frame, keep it sized, no loop.
    if (reduceMotion) {
      draw();
      const onResizeStatic = () => {
        resize();
        draw();
      };
      const ro = new ResizeObserver(onResizeStatic);
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    let last = performance.now();
    const loop = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't lurch on return.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // ~0.35 rows/sec at speed 1 — subtle forward drift.
      phase = (phase + dt * 0.35 * speed) % lineCount;
      draw();
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Resize clears the canvas — redraw a frame immediately so a correct-size
    // static frame always persists even if rAF is throttled (hidden tab).
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

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
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [color, speed, lineCount]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  );
}

export default PerspectiveGrid;

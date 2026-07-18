"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

/**
 * Events Hub brand mark — the EH monogram logo in a rounded chip with a soft
 * gradient glow on hover.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "group/logo relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[28%] shadow-[0_6px_22px_-6px_rgba(124,58,237,0.55)] ring-1 ring-white/10 transition-transform duration-300 will-change-transform hover:scale-[1.04]",
        className
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[28%] bg-[radial-gradient(circle_at_50%_25%,rgba(236,72,153,0.35),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover/logo:opacity-100" />
      <Image
        src="/events-hub-mark.png"
        alt="Events Hub"
        fill
        sizes="56px"
        priority
        className="object-cover"
      />
    </span>
  );
}

"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

/**
 * iTicket brand mark — the gradient ticket logo. Transparent PNG, so no chip
 * background; just a gentle hover lift and glow.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-300 will-change-transform hover:scale-[1.06]",
        className
      )}
    >
      <Image
        src="/iticket-mark.png"
        alt="iTicket"
        fill
        sizes="64px"
        priority
        className="object-contain drop-shadow-[0_6px_18px_rgba(99,60,235,0.45)]"
      />
    </span>
  );
}

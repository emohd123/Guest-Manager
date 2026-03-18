"use client";

import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";

interface BrandWordmarkProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

export function BrandWordmark({
  className,
  markClassName,
  textClassName,
}: BrandWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3.5", className)}>
      <BrandMark className={markClassName} />
      <span
        className={cn(
          "inline-flex items-baseline gap-2 text-[1.8rem] font-black tracking-[-0.065em]",
          textClassName
        )}
      >
        <span className="bg-[linear-gradient(135deg,#ff5a7a,#ff6b8a_42%,#7c4dff_78%,#5b3df5)] bg-clip-text text-transparent">
          Events
        </span>
        <span className="text-current">Hub</span>
      </span>
    </span>
  );
}

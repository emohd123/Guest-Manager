"use client";

import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";

interface BrandWordmarkProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showSubtitle?: boolean;
}

export function BrandWordmark({
  className,
  markClassName,
  textClassName,
  showSubtitle = false,
}: BrandWordmarkProps) {
  return (
    <div className={cn("inline-grid grid-cols-[auto_1fr] items-center gap-x-3", className)}>
      <div className="col-start-1 row-start-1 flex items-center justify-center">
        <BrandMark className={markClassName} />
      </div>
      <div className="col-start-2 row-start-1 flex items-center">
        <span
          className={cn(
            "inline-flex items-baseline gap-1.5 text-[1.8rem] font-black tracking-[-0.065em] leading-none",
            textClassName
          )}
        >
          <span className="bg-[linear-gradient(135deg,#2563eb,#7c3aed_50%,#db2777)] bg-clip-text text-transparent">
            Events
          </span>
          <span className="text-current">Hub</span>
        </span>
      </div>
      {showSubtitle && (
        <div className="col-start-2 row-start-2 mt-2">
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/60 leading-none block">
            A OneStone Platform
          </span>
        </div>
      )}
    </div>
  );
}

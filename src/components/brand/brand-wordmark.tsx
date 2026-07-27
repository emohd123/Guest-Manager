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
    <div className={cn("inline-grid grid-cols-[auto_1fr] items-center gap-x-4", className)}>
      <div className="col-start-1 row-start-1 flex items-center justify-center">
        <BrandMark className={markClassName} />
      </div>
      <div className="col-start-2 row-start-1 flex items-center">
        <span
          className={cn(
            "inline-flex items-baseline text-[1.8rem] font-black tracking-[-0.045em] leading-none",
            textClassName
          )}
        >
          <span className="bg-[linear-gradient(135deg,#3b6cf6,#6d28d9)] bg-clip-text text-transparent">
            i
          </span>
          <span className="text-current">Ticket</span>
        </span>
      </div>
      {showSubtitle && (
        <div className="col-start-2 row-start-2 mt-2">
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-600 leading-none block">
            A OneStone Platform
          </span>
        </div>
      )}
    </div>
  );
}

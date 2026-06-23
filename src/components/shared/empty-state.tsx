"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional primary call-to-action (e.g. a <Button>) shown below the copy. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Consistent empty state per the project design spec: a large subtle icon, a
 * heading, a description, and an optional primary CTA. Use this instead of
 * hand-rolling per-page empty states so they stay visually identical.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group flex flex-col items-center justify-center rounded-[40px] border border-white/10 bg-white/5 p-16 text-center sm:p-20",
        className
      )}
    >
      <div className="mx-auto flex h-20 w-20 rotate-12 items-center justify-center rounded-[32px] bg-primary/10 text-primary transition-transform duration-300 group-hover:rotate-0">
        <Icon className="h-10 w-10 -rotate-12" />
      </div>
      <div className="mt-8 space-y-2">
        <h3 className="text-2xl font-black uppercase italic leading-none tracking-tighter text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mx-auto max-w-xs text-[11px] font-bold uppercase leading-relaxed tracking-[0.2em] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-8">{action}</div> : null}
    </motion.div>
  );
}

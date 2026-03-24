import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input bg-card/90 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/35 backdrop-blur-sm h-9 w-full min-w-0 rounded-md py-1 px-3 text-base shadow-sm transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary/50 focus-visible:ring-primary/30 focus-visible:ring-2 focus-visible:shadow-[0_0_15px_rgba(99,102,241,0.2)] focus-visible:bg-card dark:focus-visible:bg-white/10",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

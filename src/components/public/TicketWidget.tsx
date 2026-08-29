"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/marketplace";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  quantityTotal: number | null;
  quantitySold: number | null;
  minPerOrder: number | null;
  maxPerOrder: number | null;
}

interface TicketWidgetProps {
  ticketTypes: TicketType[];
  onCheckout: (selection: Record<string, number>) => void | Promise<void>;
  isLoading?: boolean;
  checkoutLabel?: string;
  amountLabel?: string;
  freeEvent?: boolean;
  locale?: string;
}

export function TicketWidget({
  ticketTypes,
  onCheckout,
  isLoading,
  checkoutLabel,
  amountLabel,
  freeEvent,
  locale = "en",
}: TicketWidgetProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (id: string, delta: number, min: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      let next = current + delta;

      if (next < 0) next = 0;
      if (delta > 0 && current === 0 && min > 1) next = min;
      if (delta < 0 && next < min) next = 0;
      if (next > max) next = max;
      if (next === current) return prev;

      return { ...prev, [id]: next };
    });
  };

  const totalItems = Object.values(quantities).reduce((acc, q) => acc + q, 0);
  const totalPrice = ticketTypes.reduce((acc, t) => acc + (quantities[t.id] || 0) * (t.price ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {ticketTypes.map((ticket) => {
          const quantity = quantities[ticket.id] || 0;
          const remaining =
            ticket.quantityTotal === null
              ? null
              : Math.max(0, ticket.quantityTotal - (ticket.quantitySold ?? 0));
          const maxAllowed =
            remaining === null
              ? (ticket.maxPerOrder ?? 10)
              : Math.min(ticket.maxPerOrder ?? 10, remaining);
          const isSoldOut = maxAllowed === 0;

          return (
            <div 
              key={ticket.id} 
              className={cn(
                "rounded-xl border p-4 transition-all duration-200",
                quantity > 0
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-cyan-400/60",
                isSoldOut && "opacity-60 grayscale pointer-events-none"
              )}
            >
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight text-zinc-950 dark:text-white">{ticket.name}</h3>
                    {isSoldOut && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[10px] font-black uppercase text-zinc-500">Sold Out</span>
                    )}
                  </div>
                  {ticket.description && (
                    <p className="text-xs leading-5 text-zinc-500 dark:text-slate-300">{ticket.description}</p>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-lg font-black text-zinc-950 dark:text-white">
                      {freeEvent ? "FREE" : formatMoney(ticket.price ?? 0, ticket.currency ?? "BHD", locale)}
                    </span>
                    {ticket.quantityTotal && (
                      <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:bg-slate-800 dark:text-slate-200">
                        {Math.max(0, ticket.quantityTotal - (ticket.quantitySold ?? 0))} Left
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 dark:border-slate-700 dark:bg-slate-950">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Decrease ${ticket.name} quantity`}
                    onClick={() =>
                      updateQuantity(
                        ticket.id,
                        -1,
                        ticket.minPerOrder ?? 1,
                        maxAllowed
                      )
                    }
                    disabled={quantity === 0}
                    className="h-8 w-8 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-7 text-center font-mono text-base font-black text-zinc-900 dark:text-white">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Increase ${ticket.name} quantity`}
                    onClick={() =>
                      updateQuantity(
                        ticket.id,
                        1,
                        ticket.minPerOrder ?? 1,
                        maxAllowed
                      )
                    }
                    disabled={isSoldOut || quantity >= maxAllowed}
                    className="h-8 w-8 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {amountLabel ?? "Total Amount"}
            </span>
            <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
              {freeEvent && totalItems > 0
                ? "FREE"
                : formatMoney(totalPrice, ticketTypes[0]?.currency ?? "BHD", locale)}
            </span>
          </div>
          
          <Button
            size="lg"
            disabled={totalItems === 0 || isLoading}
            onClick={() => onCheckout(quantities)}
            className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-black text-white gap-2 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {checkoutLabel ?? "Proceed to Checkout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

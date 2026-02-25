"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

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
  onCheckout: (selection: Record<string, number>) => void;
  isLoading?: boolean;
}

export function TicketWidget({ ticketTypes, onCheckout, isLoading }: TicketWidgetProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (id: string, delta: number, min: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      
      if (next < 0) return prev;
      if (next > max) return prev;
      if (next > 0 && next < min && delta > 0) return { ...prev, [id]: min };
      if (next < min && delta < 0) return { ...prev, [id]: 0 };
      
      return { ...prev, [id]: next };
    });
  };

  const totalItems = Object.values(quantities).reduce((acc, q) => acc + q, 0);
  const totalPrice = ticketTypes.reduce((acc, t) => acc + (quantities[t.id] || 0) * (t.price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {ticketTypes.map((ticket) => {
          const quantity = quantities[ticket.id] || 0;
          const isSoldOut = ticket.quantityTotal !== null && (ticket.quantitySold ?? 0) >= ticket.quantityTotal;

          return (
            <div 
              key={ticket.id} 
              className={cn(
                "p-6 rounded-3xl border-2 transition-all duration-300",
                quantity > 0 
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                  : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-200 dark:hover:border-zinc-700",
                isSoldOut && "opacity-60 grayscale pointer-events-none"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 grow">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight">{ticket.name}</h3>
                    {isSoldOut && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase text-zinc-500">Sold Out</span>
                    )}
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{ticket.description}</p>
                  )}
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-2xl font-black text-primary">
                      {(ticket.price ?? 0) === 0 ? "FREE" : `$${((ticket.price ?? 0) / 100).toFixed(2)}`}
                    </span>
                    {ticket.quantityTotal && (
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                        {Math.max(0, ticket.quantityTotal - (ticket.quantitySold ?? 0))} Left
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(ticket.id, -1, ticket.minPerOrder ?? 1, ticket.maxPerOrder ?? 10)}
                    disabled={quantity === 0}
                    className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-zinc-800 shadow-sm"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-mono text-lg font-bold">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(ticket.id, 1, ticket.minPerOrder ?? 1, ticket.maxPerOrder ?? 10)}
                    disabled={quantity >= (ticket.maxPerOrder ?? 10)}
                    className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-zinc-800 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-6 p-1 rounded-[2rem] bg-zinc-900/10 backdrop-blur-xl border border-white/20">
        <div className="p-6 rounded-[1.75rem] bg-zinc-950 text-white shadow-2xl flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Amount</span>
            <span className="text-2xl font-black tracking-tighter">
              ${(totalPrice / 100).toFixed(2)}
            </span>
          </div>
          
          <Button
            size="lg"
            disabled={totalItems === 0 || isLoading}
            onClick={() => onCheckout(quantities)}
            className="rounded-2xl h-14 px-8 font-black text-lg gap-3 bg-white text-zinc-950 hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin h-5 w-5 border-2 border-zinc-950 border-t-transparent rounded-full" />
            ) : (
              <ShoppingCart className="h-5 w-5 fill-zinc-950" />
            )}
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}

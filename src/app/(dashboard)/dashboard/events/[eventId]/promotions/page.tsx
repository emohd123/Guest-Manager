"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function EventPromotionsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data: event } = trpc.events.get.useQuery({ id: eventId });
  const { data, isLoading, refetch } = trpc.promotions.list.useQuery({ eventId });
  const [code, setCode] = useState("");
  const [percentage, setPercentage] = useState("10");
  const [maxTickets, setMaxTickets] = useState("100");
  const [description, setDescription] = useState("");

  const createPromotion = trpc.promotions.create.useMutation({
    onSuccess: () => {
      toast.success("Promo code created");
      setCode("");
      setDescription("");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const removePromotion = trpc.promotions.remove.useMutation({
    onSuccess: () => { toast.success("Promo code removed"); refetch(); },
    onError: (error) => toast.error(error.message),
  });

  const submit = (eventForm: React.FormEvent) => {
    eventForm.preventDefault();
    createPromotion.mutate({
      eventId,
      code,
      percentage: Number(percentage),
      maxTickets: Number(maxTickets),
      description: description || undefined,
    });
  };

  return (
    <div className="space-y-8 pb-20 px-2">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ticketing</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground dark:text-white">Promo codes</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create discounts for {event?.title ?? "this event"}.</p>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-white/5 md:grid-cols-4">
        <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Code</label><Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER20" /></div>
        <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Discount %</label><Input required type="number" min="1" max="100" value={percentage} onChange={(e) => setPercentage(e.target.value)} /></div>
        <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Ticket limit</label><Input required type="number" min="1" value={maxTickets} onChange={(e) => setMaxTickets(e.target.value)} /></div>
        <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Early bird" /></div>
        <Button type="submit" disabled={createPromotion.isPending} className="md:col-span-4 w-fit"><Tag className="mr-2 h-4 w-4" />{createPromotion.isPending ? "Creating…" : "Create promo code"}</Button>
      </form>

      <div className="rounded-3xl border border-border bg-card dark:border-white/10 dark:bg-white/5">
        <div className="border-b border-border p-5 font-bold dark:border-white/10">Active codes</div>
        {isLoading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> : data?.promotions?.length ? (
          <div className="divide-y divide-border dark:divide-white/10">
            {data.promotions.map((promotion: any) => (
              <div key={promotion.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div><p className="font-black tracking-wide">{promotion.code}</p><p className="text-sm text-muted-foreground">{promotion.description || "Event discount"}</p></div>
                <div className="text-sm"><span className="font-black text-primary">{promotion.value}% off</span><span className="ml-3 text-muted-foreground">up to {promotion.max_uses ?? "—"} tickets</span></div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removePromotion.mutate({ id: promotion.id })} aria-label="Remove promo code"><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}
          </div>
        ) : <div className="p-6 text-sm text-muted-foreground">No promo codes yet.</div>}
      </div>
    </div>
  );
}

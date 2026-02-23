"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Loader2, Ticket, DollarSign, Calendar, ShieldCheck, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export interface TicketType {
  id: string;
  name: string;
  description?: string | null;
  price: number | null;
  currency?: string | null;
  quantityTotal?: number | null;
  quantitySold?: number | null;
  saleStartsAt?: string | Date | null;
  saleEndsAt?: string | Date | null;
  minPerOrder?: number | null;
  maxPerOrder?: number | null;
  transferable?: boolean | null;
  status: "active" | "paused" | "sold_out" | "archived" | null;
}

interface TicketTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  ticketType?: TicketType;
  onSuccess: () => void;
}

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  currency: "USD",
  quantityTotal: "" as string | number,
  saleStartsAt: "",
  saleEndsAt: "",
  minPerOrder: 1,
  maxPerOrder: 10,
  transferable: false,
  status: "active" as "active" | "paused" | "sold_out" | "archived",
};

export function TicketTypeModal({ open, onOpenChange, eventId, ticketType, onSuccess }: TicketTypeModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [lastId, setLastId] = useState<string | null>(null);

  if (open && (ticketType?.id ?? "new") !== lastId) {
    setLastId(ticketType?.id ?? "new");
    if (ticketType) {
      setForm({
        name: ticketType.name,
        description: ticketType.description ?? "",
        price: (ticketType.price ?? 0) / 100, // Convert cents to dollars for UI
        currency: ticketType.currency ?? "USD",
        quantityTotal: ticketType.quantityTotal ?? "",
        saleStartsAt: ticketType.saleStartsAt ? new Date(ticketType.saleStartsAt).toISOString().slice(0, 16) : "",
        saleEndsAt: ticketType.saleEndsAt ? new Date(ticketType.saleEndsAt).toISOString().slice(0, 16) : "",
        minPerOrder: ticketType.minPerOrder ?? 1,
        maxPerOrder: ticketType.maxPerOrder ?? 10,
        transferable: ticketType.transferable ?? false,
        status: ticketType.status ?? "active",
      });
    } else {
      setForm(emptyForm);
    }
  }

  const createMutation = trpc.ticketTypes.create.useMutation({
    onSuccess: () => {
      toast.success("Ticket type created");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.ticketTypes.update.useMutation({
    onSuccess: () => {
      toast.success("Ticket type updated");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...form,
      price: Math.round(Number(form.price) * 100), // Convert to cents
      quantityTotal: form.quantityTotal === "" ? undefined : Number(form.quantityTotal),
      saleStartsAt: form.saleStartsAt || undefined,
      saleEndsAt: form.saleEndsAt || undefined,
    };

    if (ticketType) {
      updateMutation.mutate({
        id: ticketType.id,
        ...payload,
      });
    } else {
      createMutation.mutate({
        eventId,
        ...payload,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0 bg-white dark:bg-zinc-950">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">
            <DialogHeader className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{ticketType ? "Edit Ticket Type" : "Create Ticket Type"}</DialogTitle>
                <DialogDescription className="text-muted-foreground text-md">
                  Configure pricing, availability, and rules for this ticket category.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. VIP Admission"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select 
                    value={form.status} 
                    onValueChange={(v: "active" | "paused" | "sold_out" | "archived") => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="sold_out">Sold Out</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's included in this ticket?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1 min-h-[100px]"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Price ({form.currency})</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Inventory Capacity</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Unlimited"
                      value={form.quantityTotal}
                      onChange={(e) => setForm({ ...form, quantityTotal: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="starts" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sale Starts At</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="starts"
                      type="datetime-local"
                      value={form.saleStartsAt}
                      onChange={(e) => setForm({ ...form, saleStartsAt: e.target.value })}
                      className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ends" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sale Ends At</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ends"
                      type="datetime-local"
                      value={form.saleEndsAt}
                      onChange={(e) => setForm({ ...form, saleEndsAt: e.target.value })}
                      className="pl-10 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-2">
                  <Label htmlFor="min" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Min Per Order</Label>
                  <Input
                    id="min"
                    type="number"
                    value={form.minPerOrder}
                    onChange={(e) => setForm({ ...form, minPerOrder: Number(e.target.value) })}
                    className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Max Per Order</Label>
                  <Input
                    id="max"
                    type="number"
                    value={form.maxPerOrder}
                    onChange={(e) => setForm({ ...form, maxPerOrder: Number(e.target.value) })}
                    className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <Label className="font-bold text-sm">Transferable</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Allow attendees to transfer tickets to other guests.</p>
                </div>
                <Switch 
                  checked={form.transferable}
                  onCheckedChange={(v) => setForm({ ...form, transferable: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-2xl border-2 font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-12 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 gap-2 min-w-[140px]"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {ticketType ? "Update Type" : "Create Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

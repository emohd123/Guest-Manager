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
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Loader2, User, Mail, Phone, Tag, Armchair, FileText } from "lucide-react";
import { Guest } from "@/types/guest";

interface GuestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  guest?: Guest | null; // If provided, we are in edit mode
  onSuccess: () => void;
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  guestType: "",
  tableNumber: "",
  seatNumber: "",
  notes: "",
};

export function GuestModal({ open, onOpenChange, eventId, guest, onSuccess }: GuestModalProps) {
  const [form, setForm] = useState(emptyForm);

  // Sync form state when guest changes or modal opens
  const [lastId, setLastId] = useState<string | undefined>(undefined);

  if (open && guest?.id !== lastId) {
    setLastId(guest?.id);
    if (guest) {
      setForm({
        firstName: guest.firstName ?? "",
        lastName: guest.lastName ?? "",
        email: guest.email ?? "",
        phone: guest.phone ?? "",
        guestType: guest.guestType ?? "",
        tableNumber: guest.tableNumber ?? "",
        seatNumber: guest.seatNumber ?? "",
        notes: guest.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }

  const createMutation = trpc.guests.create.useMutation({
    onSuccess: () => {
      toast.success("Guest added successfully");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.guests.update.useMutation({
    onSuccess: () => {
      toast.success("Guest updated successfully");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (guest) {
      updateMutation.mutate({
        id: guest.id,
        ...form,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        guestType: form.guestType || undefined,
        tableNumber: form.tableNumber || undefined,
        notes: form.notes || undefined,
      });
    } else {
      createMutation.mutate({
        eventId,
        ...form,
        lastName: form.lastName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        guestType: form.guestType || undefined,
        tableNumber: form.tableNumber || undefined,
        notes: form.notes || undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary text-primary-foreground">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {guest ? "Edit Guest" : "Add New Guest"}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            {guest ? "Update guest information and preferences." : "Fill in the details to add a guest to your event."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="h-3 w-3" /> First Name *
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="John"
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="h-3 w-3" /> Last Name
              </Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Doe"
                className="rounded-xl h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" /> Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@example.com"
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Phone className="h-3 w-3" /> Phone Number
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="rounded-xl h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestType" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Tag className="h-3 w-3" /> Guest Type
              </Label>
              <Input
                id="guestType"
                value={form.guestType}
                onChange={(e) => setForm(f => ({ ...f, guestType: e.target.value }))}
                placeholder="e.g. VIP, Staff"
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tableNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Armchair className="h-3 w-3" /> Table
              </Label>
              <Input
                id="tableNumber"
                value={form.tableNumber}
                onChange={(e) => setForm(f => ({ ...f, tableNumber: e.target.value }))}
                placeholder="Table 1"
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seatNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Armchair className="h-3 w-3" /> Seat
              </Label>
              <Input
                id="seatNumber"
                value={form.seatNumber}
                onChange={(e) => setForm(f => ({ ...f, seatNumber: e.target.value }))}
                placeholder="Seat A1"
                className="rounded-xl h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="h-3 w-3" /> Internal Notes
            </Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Allergies, special requirements, etc."
              rows={3}
              className="rounded-xl"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11 px-6 font-bold uppercase tracking-widest text-xs"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="rounded-xl h-11 px-10 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                guest ? "Save Changes" : "Add Guest"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

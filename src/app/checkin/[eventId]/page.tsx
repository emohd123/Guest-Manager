"use client";

import { use, useMemo, useState } from "react";
import { Loader2, PlusCircle, QrCode, Search, ToggleLeft, ToggleRight, UserPlus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QRScannerModal, type ScanResult } from "@/components/checkin/QRScannerModal";

type DeviceIdentity = {
  id: string;
  name: string;
};

function getBrowserDeviceIdentity(): DeviceIdentity {
  if (typeof window === "undefined") {
    return { id: "web", name: "Web Scanner" };
  }
  const existing = window.localStorage.getItem("checkin_web_device");
  if (existing) {
    try {
      return JSON.parse(existing) as DeviceIdentity;
    } catch {
      // no-op
    }
  }

  const created = {
    id: `web_${crypto.randomUUID().replace(/-/g, "")}`,
    name: `Web Scanner ${new Date().toLocaleDateString()}`,
  };
  window.localStorage.setItem("checkin_web_device", JSON.stringify(created));
  return created;
}

export default function CheckinPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "checked_in">("all");
  const [actionMode, setActionMode] = useState<"check_in" | "checkout">("check_in");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [walkupOpen, setWalkupOpen] = useState(false);
  const [device] = useState<DeviceIdentity>(() => getBrowserDeviceIdentity());
  const [walkupForm, setWalkupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const utils = trpc.useUtils();
  const guestsQuery = trpc.guests.list.useQuery({
    eventId,
    limit: 800,
  });

  const checkInMutation = trpc.guests.checkIn.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.guests.list.invalidate({ eventId, limit: 800 }),
        utils.scans.arrivals.invalidate({ eventId, limit: 100, offset: 0 }),
      ]);
    },
  });

  const checkoutMutation = trpc.guests.undoCheckIn.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.guests.list.invalidate({ eventId, limit: 800 }),
        utils.scans.arrivals.invalidate({ eventId, limit: 100, offset: 0 }),
      ]);
    },
  });

  const createGuestMutation = trpc.guests.create.useMutation({
    onSuccess: async (guest) => {
      if (actionMode === "check_in") {
        await checkInMutation.mutateAsync({
          eventId,
          guestId: guest.id,
          deviceInfo: {
            deviceId: device.id,
            deviceName: device.name,
          },
        });
      }
      await utils.guests.list.invalidate({ eventId, limit: 800 });
      toast.success("Walkup guest added");
      setWalkupOpen(false);
      setWalkupForm({ firstName: "", lastName: "", email: "", phone: "" });
    },
    onError: () => {
      toast.error("Unable to add walkup guest");
    },
  });

  const guests = useMemo(() => guestsQuery.data?.guests ?? [], [guestsQuery.data?.guests]);
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const pending = guest.status !== "checked_in";
      if (filter === "pending" && !pending) return false;
      if (filter === "checked_in" && pending) return false;
      if (!search.trim()) return true;
      const haystack = `${guest.firstName ?? ""} ${guest.lastName ?? ""} ${guest.email ?? ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [filter, guests, search]);

  const checkedInCount = guests.filter((guest) => guest.status === "checked_in").length;

  async function toggleGuest(guestId: string, isCheckedIn: boolean) {
    if (actionMode === "check_in") {
      if (isCheckedIn) {
        toast.message("Guest is already checked in");
        return;
      }
      await checkInMutation.mutateAsync({
        eventId,
        guestId,
        deviceInfo: {
          deviceId: device.id,
          deviceName: device.name,
        },
      });
      toast.success("Guest checked in");
      return;
    }

    await checkoutMutation.mutateAsync({
      eventId,
      guestId,
    });
    toast.success("Guest checked out");
  }

  async function handleBarcodeScan(barcode: string): Promise<ScanResult> {
    const ticket = await utils.client.tickets.getByBarcode.query({ eventId, barcode });

    if (!ticket) {
      return { status: "not_found", barcode };
    }
    if (ticket.status === "voided") {
      return {
        status: "voided",
        attendeeName: ticket.attendeeName ?? "Guest",
        barcode,
      };
    }
    if (!ticket.guestId) {
      return {
        status: "success",
        attendeeName: ticket.attendeeName ?? "Guest",
        ticketType: actionMode === "check_in" ? "Checked In" : "Checked Out",
        barcode,
      };
    }

    if (actionMode === "check_in") {
      const result = await checkInMutation.mutateAsync({
        eventId,
        guestId: ticket.guestId,
        barcode,
        deviceInfo: {
          deviceId: device.id,
          deviceName: device.name,
        },
      });
      if (result.alreadyCheckedIn) {
        return {
          status: "already_checked_in",
          attendeeName: ticket.attendeeName ?? "Guest",
          barcode,
        };
      }
      return {
        status: "success",
        attendeeName: ticket.attendeeName ?? "Guest",
        ticketType: ticket.ticketTypeName ?? "Ticket",
        barcode,
      };
    }

    await checkoutMutation.mutateAsync({
      eventId,
      guestId: ticket.guestId,
    });
    return {
      status: "success",
      attendeeName: ticket.attendeeName ?? "Guest",
      ticketType: "Checked Out",
      barcode,
    };
  }

  const isMutating =
    checkInMutation.isPending || checkoutMutation.isPending || createGuestMutation.isPending;

  return (
    <div className="h-full bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Check In Console</h1>
            <p className="text-sm text-muted-foreground">
              {checkedInCount} of {guests.length} checked in • Device: {device.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setActionMode((mode) => (mode === "check_in" ? "checkout" : "check_in"))}
            >
              {actionMode === "check_in" ? (
                <>
                  <ToggleRight className="h-4 w-4 text-green-600" />
                  Mode: Check In
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 text-blue-600" />
                  Mode: Check Out
                </>
              )}
            </Button>
            <Button className="gap-2" onClick={() => setScannerOpen(true)} disabled={isMutating}>
              <QrCode className="h-4 w-4" />
              Scan Ticket
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setWalkupOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Add Walkup
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search guest name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "checked_in"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? "default" : "outline"}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All" : value === "pending" ? "Pending" : "Checked In"}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border">
          <div className="grid grid-cols-12 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
            <div className="col-span-4">Guest</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Action</div>
          </div>
          <div className="divide-y">
            {guestsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading guests...
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No guests found.</div>
            ) : (
              filteredGuests.map((guest) => {
                const isCheckedIn = guest.status === "checked_in";
                const name = `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim() || "Guest";
                return (
                  <div key={guest.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                    <div className="col-span-4">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">{guest.guestType ?? "Guest"}</div>
                    </div>
                    <div className="col-span-3 text-muted-foreground">{guest.email ?? "—"}</div>
                    <div className="col-span-2">
                      <Badge variant={isCheckedIn ? "default" : "secondary"}>
                        {isCheckedIn ? "Checked In" : "Pending"}
                      </Badge>
                    </div>
                    <div className="col-span-3 text-right">
                      <Button
                        size="sm"
                        className="gap-2"
                        variant={actionMode === "check_in" ? "default" : "outline"}
                        onClick={() => toggleGuest(guest.id, isCheckedIn)}
                        disabled={isMutating}
                      >
                        {actionMode === "check_in" ? (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Check In
                          </>
                        ) : (
                          "Check Out"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <QRScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      <Dialog open={walkupOpen} onOpenChange={setWalkupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Walkup Guest</DialogTitle>
            <DialogDescription>
              Create a guest record quickly and optionally check them in immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="walkup-first-name">First name</Label>
              <Input
                id="walkup-first-name"
                value={walkupForm.firstName}
                onChange={(event) =>
                  setWalkupForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="walkup-last-name">Last name</Label>
              <Input
                id="walkup-last-name"
                value={walkupForm.lastName}
                onChange={(event) =>
                  setWalkupForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="walkup-email">Email</Label>
              <Input
                id="walkup-email"
                type="email"
                value={walkupForm.email}
                onChange={(event) =>
                  setWalkupForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="walkup-phone">Phone</Label>
              <Input
                id="walkup-phone"
                value={walkupForm.phone}
                onChange={(event) =>
                  setWalkupForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                if (!walkupForm.firstName.trim()) {
                  toast.error("First name is required");
                  return;
                }
                createGuestMutation.mutate({
                  eventId,
                  firstName: walkupForm.firstName.trim(),
                  lastName: walkupForm.lastName.trim() || undefined,
                  email: walkupForm.email.trim() || undefined,
                  phone: walkupForm.phone.trim() || undefined,
                  guestType: "Walkup",
                });
              }}
              disabled={createGuestMutation.isPending}
            >
              {createGuestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Walkup"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

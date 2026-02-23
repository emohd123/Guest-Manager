"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { GuestImportDialog } from "@/components/guests/guest-import-dialog";
import { GuestQrDialog, BulkQrPrintDialog } from "@/components/guests/guest-qr-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Upload,
  MoreHorizontal,
  Trash2,
  Edit,
  CheckCircle,
  Download,
  QrCode,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

type Guest = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  guestType: string | null;
  tableNumber: string | null;
  tags: string[] | null;
  notes: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  invited: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  confirmed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  waitlisted:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  checked_in:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const emptyGuestForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  guestType: "",
  tableNumber: "",
  notes: "",
};

export default function EventGuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [guestForm, setGuestForm] = useState(emptyGuestForm);
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);
  const [bulkQrOpen, setBulkQrOpen] = useState(false);

  type GuestStatus =
    | "invited"
    | "confirmed"
    | "declined"
    | "waitlisted"
    | "checked_in"
    | "no_show";
  const [statusFilter, setStatusFilter] = useState<GuestStatus | "all">("all");

  const { data, isLoading, refetch } = trpc.guests.list.useQuery({
    eventId,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const { data: stats, refetch: refetchStats } = trpc.guests.stats.useQuery({
    eventId,
  });

  const createGuest = trpc.guests.create.useMutation({
    onSuccess: () => {
      toast.success("Guest added");
      setAddOpen(false);
      setGuestForm(emptyGuestForm);
      refetch();
      refetchStats();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteGuest = trpc.guests.delete.useMutation({
    onSuccess: () => {
      toast.success("Guest removed");
      refetch();
      refetchStats();
    },
  });

  const updateGuest = trpc.guests.update.useMutation({
    onSuccess: () => {
      toast.success("Guest updated");
      setEditGuest(null);
      refetch();
      refetchStats();
    },
  });

  const bulkCreate = trpc.guests.bulkCreate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} guests imported`);
      setImportOpen(false);
      refetch();
      refetchStats();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleExportCSV = () => {
    const guests = (data?.guests ?? []) as Guest[];
    if (guests.length === 0) {
      toast.error("No guests to export");
      return;
    }
    const csvHeaders = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Status",
      "Type",
      "Table",
    ];
    const csvRows = guests.map((g) => [
      g.firstName ?? "",
      g.lastName ?? "",
      g.email ?? "",
      g.phone ?? "",
      g.status,
      g.guestType ?? "",
      g.tableNumber ?? "",
    ]);
    const csv = [csvHeaders, ...csvRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guests-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Guest list exported");
  };

  const openEditDialog = (guest: Guest) => {
    setEditGuest(guest);
    setGuestForm({
      firstName: guest.firstName ?? "",
      lastName: guest.lastName ?? "",
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      guestType: guest.guestType ?? "",
      tableNumber: guest.tableNumber ?? "",
      notes: guest.notes ?? "",
    });
  };

  const handleEditSave = () => {
    if (!editGuest) return;
    updateGuest.mutate({
      id: editGuest.id,
      firstName: guestForm.firstName || undefined,
      lastName: guestForm.lastName || undefined,
      email: guestForm.email || undefined,
      phone: guestForm.phone || undefined,
      guestType: guestForm.guestType || undefined,
      tableNumber: guestForm.tableNumber || undefined,
      notes: guestForm.notes || undefined,
    });
  };

  const columns: ColumnDef<Guest>[] = [
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <span className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </span>
          {row.original.guestType && (
            <p className="text-xs text-muted-foreground">
              {row.original.guestType}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.email ?? "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={statusColors[row.original.status] ?? ""}
        >
          {row.original.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "tableNumber",
      header: "Table",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.tableNumber ?? "—"}</span>
      ),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) =>
        row.original.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.original.status !== "checked_in" && (
              <DropdownMenuItem
                onClick={() =>
                  updateGuest.mutate({
                    id: row.original.id,
                    status: "checked_in",
                  })
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Check In
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => openEditDialog(row.original)}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setQrGuest(row.original)}
            >
              <QrCode className="mr-2 h-4 w-4" /> QR Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteGuest.mutate({ id: row.original.id })}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Guest List</h1>
            <p className="text-muted-foreground">
              {stats?.total ?? 0} guests · {stats?.checkedIn ?? 0} checked in
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setBulkQrOpen(true)}
            disabled={!data?.guests?.length}
          >
            <Printer className="h-4 w-4" /> Print Badges
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setGuestForm(emptyGuestForm);
              setAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Guest
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.guests ?? []) as Guest[]}
        searchKey="firstName"
        searchPlaceholder="Search guests..."
        isLoading={isLoading}
        toolbar={
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as GuestStatus | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="waitlisted">Waitlisted</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Import Dialog */}
      <GuestImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        isImporting={bulkCreate.isPending}
        onImport={(guests) => {
          bulkCreate.mutate({ eventId, guests });
        }}
      />

      {/* Add Guest Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Guest</DialogTitle>
            <DialogDescription>
              Manually add a guest to this event.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createGuest.mutate({
                eventId,
                firstName: guestForm.firstName,
                lastName: guestForm.lastName || undefined,
                email: guestForm.email || undefined,
                phone: guestForm.phone || undefined,
                guestType: guestForm.guestType || undefined,
                tableNumber: guestForm.tableNumber || undefined,
                notes: guestForm.notes || undefined,
              });
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="g-firstName">First Name *</Label>
                <Input
                  id="g-firstName"
                  value={guestForm.firstName}
                  onChange={(e) =>
                    setGuestForm((d) => ({
                      ...d,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-lastName">Last Name</Label>
                <Input
                  id="g-lastName"
                  value={guestForm.lastName}
                  onChange={(e) =>
                    setGuestForm((d) => ({ ...d, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="g-email">Email</Label>
                <Input
                  id="g-email"
                  type="email"
                  value={guestForm.email}
                  onChange={(e) =>
                    setGuestForm((d) => ({ ...d, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-phone">Phone</Label>
                <Input
                  id="g-phone"
                  value={guestForm.phone}
                  onChange={(e) =>
                    setGuestForm((d) => ({ ...d, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="g-type">Guest Type</Label>
                <Input
                  id="g-type"
                  placeholder="e.g. VIP, Speaker, Media"
                  value={guestForm.guestType}
                  onChange={(e) =>
                    setGuestForm((d) => ({
                      ...d,
                      guestType: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-table">Table Number</Label>
                <Input
                  id="g-table"
                  value={guestForm.tableNumber}
                  onChange={(e) =>
                    setGuestForm((d) => ({
                      ...d,
                      tableNumber: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-notes">Notes</Label>
              <Textarea
                id="g-notes"
                value={guestForm.notes}
                onChange={(e) =>
                  setGuestForm((d) => ({ ...d, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createGuest.isPending}>
                {createGuest.isPending ? "Adding..." : "Add Guest"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog (single guest) */}
      <GuestQrDialog
        open={!!qrGuest}
        onOpenChange={(open) => {
          if (!open) setQrGuest(null);
        }}
        guest={qrGuest}
      />

      {/* Bulk QR Print Dialog */}
      <BulkQrPrintDialog
        open={bulkQrOpen}
        onOpenChange={setBulkQrOpen}
        guests={(data?.guests ?? []) as Guest[]}
      />

      {/* Edit Guest Dialog */}
      <Dialog
        open={!!editGuest}
        onOpenChange={(open) => {
          if (!open) setEditGuest(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Guest</DialogTitle>
            <DialogDescription>Update guest details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSave();
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="e-firstName">First Name *</Label>
                <Input
                  id="e-firstName"
                  value={guestForm.firstName}
                  onChange={(e) =>
                    setGuestForm((d) => ({
                      ...d,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-lastName">Last Name</Label>
                <Input
                  id="e-lastName"
                  value={guestForm.lastName}
                  onChange={(e) =>
                    setGuestForm((d) => ({ ...d, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="e-email">Email</Label>
                <Input
                  id="e-email"
                  type="email"
                  value={guestForm.email}
                  onChange={(e) =>
                    setGuestForm((d) => ({ ...d, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-phone">Phone</Label>
                <Input
                  id="e-phone"
                  value={guestForm.phone}
                  onChange={(e) =>
                    setGuestForm((d) => ({ ...d, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="e-type">Guest Type</Label>
                <Input
                  id="e-type"
                  placeholder="e.g. VIP, Speaker, Media"
                  value={guestForm.guestType}
                  onChange={(e) =>
                    setGuestForm((d) => ({
                      ...d,
                      guestType: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-table">Table Number</Label>
                <Input
                  id="e-table"
                  value={guestForm.tableNumber}
                  onChange={(e) =>
                    setGuestForm((d) => ({
                      ...d,
                      tableNumber: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-notes">Notes</Label>
              <Textarea
                id="e-notes"
                value={guestForm.notes}
                onChange={(e) =>
                  setGuestForm((d) => ({ ...d, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditGuest(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateGuest.isPending}>
                {updateGuest.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

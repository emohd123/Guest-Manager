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
import { GuestModal } from "@/components/guests/GuestModal";
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
  seatNumber: string | null;
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


export default function EventGuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
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

  const { data: stats, refetch: refetchStats } = trpc.guests.stats.useQuery({ eventId });

  const deleteGuest = trpc.guests.delete.useMutation({
    onSuccess: () => {
      toast.success("Guest removed");
      refetch();
      refetchStats();
    },
  });

  const updateGuest = trpc.guests.update.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
      toast.success("Guest updated");
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
      header: "Table/Seat",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.tableNumber ?? "—"}</span>
          {row.original.seatNumber && (
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
              Seat {row.original.seatNumber}
            </span>
          )}
        </div>
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
              setEditGuest(null);
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

      {/* Unified Guest Modal */}
      <GuestModal
        open={addOpen || !!editGuest}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false);
            setEditGuest(null);
          }
        }}
        eventId={eventId}
        guest={editGuest}
        onSuccess={() => {
          refetch();
          refetchStats();
        }}
      />

      {/* QR Code Dialog (single guest) */}
      <GuestQrDialog
        open={!!qrGuest}
        onOpenChange={(open) => {
          if (!open) setQrGuest(null);
        }}
        guest={qrGuest as NonNullable<Guest>}
      />

      {/* Bulk QR Print Dialog */}
      <BulkQrPrintDialog
        open={bulkQrOpen}
        onOpenChange={setBulkQrOpen}
        guests={(data?.guests ?? []) as NonNullable<Guest>[]}
      />
    </div>
  );
}

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
import { Guest } from "@/types/guest";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Plus,
  Upload,
  MoreHorizontal,
  Trash2,
  Edit,
  CheckCircle,
  Undo2,
  Download,
  QrCode,
  Printer,
  Users,
  Mail,
} from "lucide-react";
import { toast } from "sonner";


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
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

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

  const bulkUpdateStatus = trpc.guests.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated} guests`);
      setRowSelection({});
      refetch();
      refetchStats();
    },
  });

  const undoCheckIn = trpc.guests.undoCheckIn.useMutation({
    onSuccess: () => {
      toast.success("Check-in undone");
      refetch();
      refetchStats();
    },
  });

  const sendEmail = trpc.guests.sendTicketEmail.useMutation({
    onSuccess: () => {
      toast.success("Ticket email queued successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send email");
    }
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
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <span className="text-sm capitalize">{row.original.source ?? "—"}</span>
      ),
    },
    {
      accessorKey: "barcode",
      header: "Barcode",
      cell: ({ row }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = (row.original as any).ticket;
        return <span className="text-sm">{t?.barcode ?? "—"}</span>;
      },
    },
    {
      id: "pdfUrl",
      header: "PDF",
      cell: ({ row }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = (row.original as any).ticket;
        return t ? (
          <a
            href={`/api/tickets/${t.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Download
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "walletUrl",
      header: "Wallet",
      cell: ({ row }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = (row.original as any).ticket;
        return t?.walletUrl ? (
          <a
            href={t.walletUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Download
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "tags",
      header: "Tag",
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
      id: "section",
      header: "Section",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.tableNumber ?? "—"}</span>
      ),
    },
    {
      id: "row",
      header: "Row",
      cell: () => (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    },
    {
      accessorKey: "seatNumber",
      header: "Seat Number",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.seatNumber ?? "—"}</span>
      ),
    },
    {
      id: "quick_actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          {row.original.status !== "checked_in" ? (
            <Button
              size="sm"
              variant="outline"
              className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20"
              onClick={() =>
                updateGuest.mutate({
                  id: row.original.id,
                  status: "checked_in",
                })
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Check In
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 hover:text-orange-700 border-orange-500/20"
              onClick={() =>
                undoCheckIn.mutate({
                  eventId,
                  guestId: row.original.id,
                })
              }
            >
              <Undo2 className="mr-2 h-4 w-4" /> Undo
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openEditDialog(row.original)}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setQrGuest(row.original)}
              >
                <QrCode className="mr-2 h-4 w-4" /> View QR
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(row.original as any).ticket ? (
                  <a
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/api/tickets/${(row.original as any).ticket.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full cursor-pointer items-center"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </a>
                ) : (
                  <span className="flex w-full opacity-50"><Download className="mr-2 h-4 w-4" /> Download PDF</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="mr-2 h-4 w-4" /> Apple Wallet
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  sendEmail.mutate({ guestId: row.original.id });
                }}
                disabled={sendEmail.isPending}
              >
                <Mail className="mr-2 h-4 w-4" /> Email
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
        </div>
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
            <p className="text-muted-foreground">Manage attendance and guest details</p>
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

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Total Attendees</h3>
          </div>
          <p className="text-3xl font-bold">{stats?.total ?? 0}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card md:col-span-3 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Check-in Progress</h3>
            <span className="text-sm font-medium">
              {stats?.checkedIn ?? 0} / {stats?.total ?? 0} ({stats?.total ? Math.round(((stats?.checkedIn ?? 0) / stats.total) * 100) : 0}%)
            </span>
          </div>
          <Progress value={stats?.total ? ((stats?.checkedIn ?? 0) / stats.total) * 100 : 0} className="h-3" />
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Checked In ({stats?.checked_in ?? 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Invited ({stats?.invited ?? 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Confirmed ({stats?.confirmed ?? 0})</span>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.guests ?? []) as Guest[]}
        searchKey="firstName"
        searchPlaceholder="Search guests..."
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        toolbar={
          <div className="flex gap-2 items-center">
            {Object.keys(rowSelection).length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="gap-2 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                    Bulk Actions ({Object.keys(rowSelection).length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      const selectedIds = Object.keys(rowSelection).filter(Boolean);
                      if (selectedIds.length) {
                        bulkUpdateStatus.mutate({ ids: selectedIds, status: "checked_in" });
                      }
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Bulk Check In
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const selectedIds = Object.keys(rowSelection).filter(Boolean);
                      if (selectedIds.length) {
                        bulkUpdateStatus.mutate({ ids: selectedIds, status: "confirmed" });
                      }
                    }}
                  >
                    <Undo2 className="mr-2 h-4 w-4 text-orange-500" /> Undo Check In
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
          </div>
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

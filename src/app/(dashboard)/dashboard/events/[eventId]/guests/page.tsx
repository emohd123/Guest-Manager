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
import { motion } from "framer-motion";
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
  Search,
  ChevronRight,
  Activity,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getGuestConfirmationLabel(rsvpStatus: string | null | undefined) {
  switch (rsvpStatus) {
    case "accepted":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "maybe":
      return "Maybe";
    default:
      return "Not Yet Confirmed";
  }
}

const statusColors: Record<string, string> = {
  invited: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
  declined: "bg-red-500/10 text-red-400 border-red-500/20",
  waitlisted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  checked_in: "bg-primary/10 text-primary border-primary/20",
  no_show: "bg-white/10 text-white/40 border-white/5",
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

  type GuestStatus = "invited" | "confirmed" | "declined" | "waitlisted" | "checked_in" | "no_show";
  const [statusFilter, setStatusFilter] = useState<GuestStatus | "all">("all");

  const { data, isLoading, refetch } = trpc.guests.list.useQuery({
    eventId,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const { data: stats, refetch: refetchStats } = trpc.guests.stats.useQuery({ eventId });
  const { data: event } = trpc.events.get.useQuery({ id: eventId });

  const deleteGuest = trpc.guests.delete.useMutation({
    onSuccess: () => {
      toast.success("Guest removed from guest list");
      refetch();
      refetchStats();
    },
  });

  const updateGuest = trpc.guests.update.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
      toast.success("Guest list updated");
    },
  });

  const bulkCreate = trpc.guests.bulkCreate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} guests added to the guest list`);
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
      toast.success(`Updated ${data.updated} guest profiles`);
      setRowSelection({});
      refetch();
      refetchStats();
    },
  });

  const undoCheckIn = trpc.guests.undoCheckIn.useMutation({
    onSuccess: () => {
      toast.success("Check-in status reverted");
      refetch();
      refetchStats();
    },
  });

  const sendEmail = trpc.guests.sendTicketEmail.useMutation({
    onSuccess: () => {
      toast.success("Ticket email sent");
    },
    onError: (err) => {
      if (err.message.includes("RESEND_API_KEY")) {
        toast.error("Email sending is not configured for this local app yet.");
        return;
      }
      toast.error(err.message || "Send failed");
    }
  });

  const handleExportCSV = () => {
    const guests = (data?.guests ?? []) as Guest[];
    if (guests.length === 0) {
      toast.error("Guest list is empty");
      return;
    }
    const csvHeaders = ["Guest Name", "Current State", "Allocation", "Confirmation"];
    const csvRows = guests.map((g) => [
      `${g.firstName ?? ""} ${g.lastName ?? ""}`.trim() || "Guest",
      g.status.replace("_", " "),
      g.tableNumber ? `Table ${g.tableNumber}` : "General Admission",
      getGuestConfirmationLabel(g.rsvpStatus),
    ]);
    const csv = [csvHeaders, ...csvRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guest-list-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
      toast.success("Guest list exported");
  };

  const columns: ColumnDef<Guest>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
    },
    {
      accessorKey: "firstName",
      header: "Guest Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black italic text-xs text-white/40">
              {row.original.firstName?.[0]}{row.original.lastName?.[0]}
           </div>
           <div>
            <p className="font-black italic text-white tracking-tight uppercase leading-none mb-1">
              {row.original.firstName} {row.original.lastName}
            </p>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
              {row.original.guestType || "General Guest"}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Current State",
      cell: ({ row }) => (
        <Badge className={cn("rounded-full px-3 py-0.5 font-black text-[9px] uppercase tracking-widest border italic shadow-sm", statusColors[row.original.status])}>
          {row.original.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      id: "details",
      header: "Allocation",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-[10px] font-black text-white italic tracking-tight uppercase leading-none">
             {row.original.tableNumber ? `Table ${row.original.tableNumber}` : "General Admission"}
          </p>
          <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest flex items-center gap-2">
            <Zap className="h-2.5 w-2.5" />
            {(row.original as any).ticket?.barcode || "No Ticket"}
          </p>
        </div>
      ),
    },
    {
      id: "confirmation",
      header: "Confirmation",
      cell: ({ row }) => {
        const isConfirmed = row.original.rsvpStatus === "accepted";
        return (
          <div className="space-y-1">
            <Badge
              className={cn(
                "rounded-full px-3 py-0.5 font-black text-[9px] uppercase tracking-widest border italic shadow-sm",
                isConfirmed
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
              )}
            >
              {getGuestConfirmationLabel(row.original.rsvpStatus)}
            </Badge>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
              {row.original.rsvpAt ? new Date(row.original.rsvpAt).toLocaleString() : "Waiting for guest response"}
            </p>
          </div>
        );
      },
    },
    {
      id: "quick_actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.status !== "checked_in" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-10 px-4 rounded-xl bg-primary/10 text-primary font-black italic uppercase tracking-widest text-[9px] hover:bg-primary hover:text-white border-primary/20 transition-all active:scale-95"
              onClick={() => updateGuest.mutate({ id: row.original.id, status: "checked_in" })}
            >
              Check In
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-10 px-4 rounded-xl bg-white/5 text-white/40 font-black italic uppercase tracking-widest text-[9px] hover:bg-white/10 hover:text-white border-white/10 transition-all active:scale-95"
              onClick={() => undoCheckIn.mutate({ eventId, guestId: row.original.id })}
            >
              Undo
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-white/10 hover:text-white hover:bg-white/5 border border-white/5">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] p-2 bg-slate-950 border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
              <DropdownMenuItem onClick={() => setEditGuest(row.original)} className="rounded-xl font-black italic uppercase tracking-widest text-[9px] focus:bg-white/10 focus:text-white py-3 gap-3">
                <Edit className="h-3.5 w-3.5" /> Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQrGuest(row.original)} className="rounded-xl font-black italic uppercase tracking-widest text-[9px] focus:bg-white/10 focus:text-white py-3 gap-3">
                <QrCode className="h-3.5 w-3.5" /> View QR Code
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5 mx-2 my-2" />
              <DropdownMenuItem onClick={() => sendEmail.mutate({ guestId: row.original.id })} className="rounded-xl font-black italic uppercase tracking-widest text-[9px] focus:bg-white/10 focus:text-white py-3 gap-3">
                <Mail className="h-3.5 w-3.5" /> Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5 mx-2 my-2" />
              <DropdownMenuItem onClick={() => deleteGuest.mutate({ id: row.original.id })} className="rounded-xl font-black italic uppercase tracking-widest text-[9px] text-red-500 focus:bg-red-500/10 focus:text-red-400 py-3 gap-3">
                <Trash2 className="h-3.5 w-3.5" /> Delete Guest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all group">
              <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Guests</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
               <Users className="h-3 w-3 text-primary" />
               {event?.title || "Event"} Guest List
            </p>
          </motion.div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white/60 hover:text-white font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3" onClick={() => setBulkQrOpen(true)}>
            <Printer className="h-4 w-4" /> Print QR Codes
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white/60 hover:text-white font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white group hover:border-primary/50 transition-all font-black italic uppercase tracking-widest text-[10px] flex gap-3" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 group-hover:text-primary" /> Import Guests
          </Button>
          <Button className="h-12 px-8 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 font-black italic uppercase tracking-widest text-[10px] flex gap-3 transition-all hover:scale-105 active:scale-95" onClick={() => { setEditGuest(null); setAddOpen(true); }}>
            <Plus className="h-5 w-5" /> Add Guest
          </Button>
        </div>
      </div>

      {/* Analytics Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-8 rounded-[32px] bg-white/5 border border-white/10 flex flex-col justify-center gap-4 relative overflow-hidden group">
           <div className="relative z-10 flex flex-col gap-1">
             <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total Guests</p>
             <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{stats?.total ?? 0}</h3>
             <p className="text-[9px] font-bold text-primary uppercase tracking-tighter mt-2">Guest Records</p>
           </div>
           <Users className="absolute -right-4 -bottom-4 h-24 w-24 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </motion.div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="p-8 rounded-[32px] bg-white/5 border border-white/10 lg:col-span-3 flex flex-col justify-center relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <Activity className="h-5 w-5 text-primary animate-pulse" />
               <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Check-in Progress</h3>
            </div>
            <span className="font-black italic text-primary text-xl">
               {stats?.checkedIn ?? 0} <span className="text-sm text-white/10">/ {stats?.total ?? 0}</span>
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${stats?.total ? Math.round(((stats?.checkedIn ?? 0) / stats.total) * 100) : 0}%` }}
                 className="h-full bg-linear-to-r from-primary to-primary/40 rounded-full shadow-[0_0_15px_rgba(255,95,82,0.3)]"
               />
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {[
                { label: "Checked In", count: stats?.checked_in ?? 0, color: "bg-primary" },
                { label: "Invited", count: stats?.invited ?? 0, color: "bg-blue-500" },
                { label: "Confirmed", count: stats?.confirmed ?? 0, color: "bg-green-500" }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", item.color)} />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">{item.label} ({item.count})</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-48 bg-linear-to-l from-primary/5 to-transparent pointer-events-none" />
        </motion.div>
      </div>

      {/* Main Roster Grid */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <DataTable
          columns={columns}
          data={(data?.guests ?? []) as Guest[]}
          searchKey="firstName"
          searchPlaceholder="Search guest list..."
          isLoading={isLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          toolbar={
            <div className="flex gap-3 items-center">
              {Object.keys(rowSelection).length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-12 px-6 rounded-2xl bg-primary/10 border-primary/30 text-primary font-black italic uppercase tracking-widest text-[10px] transition-all hover:bg-primary hover:text-white flex gap-3">
                       Bulk Actions ({Object.keys(rowSelection).length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-2 bg-slate-950 border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <DropdownMenuItem
                      onClick={() => {
                        const selectedIds = Object.keys(rowSelection).filter(Boolean);
                        if (selectedIds.length) bulkUpdateStatus.mutate({ ids: selectedIds, status: "checked_in" });
                      }}
                      className="rounded-xl font-black italic uppercase tracking-widest text-[9px] focus:bg-white/10 focus:text-white py-3 gap-3"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Check In Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const selectedIds = Object.keys(rowSelection).filter(Boolean);
                        if (selectedIds.length) bulkUpdateStatus.mutate({ ids: selectedIds, status: "confirmed" });
                      }}
                      className="rounded-xl font-black italic uppercase tracking-widest text-[9px] focus:bg-white/10 focus:text-white py-3 gap-3"
                    >
                      <Undo2 className="h-3.5 w-3.5 text-orange-500" /> Mark as Confirmed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as GuestStatus | "all")}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-white/3 border-white/5 text-white/60 font-black italic uppercase tracking-widest text-[10px] focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 rounded-2xl shadow-2xl">
                  <SelectItem value="all" className="rounded-xl font-black italic uppercase tracking-widest text-[9px]">All Guests</SelectItem>
                  <SelectItem value="invited" className="rounded-xl font-black italic uppercase tracking-widest text-[9px]">Invited Only</SelectItem>
                  <SelectItem value="confirmed" className="rounded-xl font-black italic uppercase tracking-widest text-[9px]">Confirmed Only</SelectItem>
                  <SelectItem value="checked_in" className="rounded-xl font-black italic uppercase tracking-widest text-[9px]">Checked In</SelectItem>
                  <SelectItem value="declined" className="rounded-xl font-black italic uppercase tracking-widest text-[9px]">Declined Only</SelectItem>
                  <SelectItem value="waitlisted" className="rounded-xl font-black italic uppercase tracking-widest text-[9px]">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </motion.div>

      {/* Dialog Components */}
      <GuestImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        isImporting={bulkCreate.isPending}
        onImport={(guests) => bulkCreate.mutate({ eventId, guests })}
      />

      <GuestModal
        open={addOpen || !!editGuest}
        onOpenChange={(open) => { if (!open) { setAddOpen(false); setEditGuest(null); } }}
        eventId={eventId}
        guest={editGuest}
        onSuccess={() => { refetch(); refetchStats(); }}
      />

      <GuestQrDialog
        open={!!qrGuest}
        onOpenChange={(open) => { if (!open) setQrGuest(null); }}
        guest={qrGuest as NonNullable<Guest>}
      />

      <BulkQrPrintDialog
        open={bulkQrOpen}
        onOpenChange={setBulkQrOpen}
        guests={(data?.guests ?? []) as NonNullable<Guest>[]}
      />
    </div>
  );
}


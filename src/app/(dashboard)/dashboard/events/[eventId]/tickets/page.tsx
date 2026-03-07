"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, MoreHorizontal, Edit, Trash, AlertCircle, Activity, Zap, Target } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TicketTypeModal } from "@/components/tickets/TicketTypeModal";
import type { TicketType } from "@/components/tickets/TicketTypeModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TicketsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data: ticketTypesList, isLoading, refetch } = trpc.ticketTypes.list.useQuery({ eventId });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = trpc.ticketTypes.delete.useMutation({
    onSuccess: () => {
      toast.success("Ticket type deleted");
      refetch();
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const tickets = ticketTypesList ?? [];

  const columns = [
    {
      accessorKey: "name",
      header: "Ticket Type",
      cell: ({ row }: { row: { original: TicketType } }) => (
        <div className="flex flex-col gap-1">
          <span className="font-black italic text-white uppercase tracking-tight">{row.original.name}</span>
          {row.original.description && (
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest truncate max-w-[240px] italic">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }: { row: { original: TicketType } }) => (
        <span className="font-black italic text-primary">
          {row.original.price === 0 || row.original.price === null ? (
            "Free"
          ) : (
            `$${((row.original.price ?? 0) / 100).toFixed(2)}`
          )}
        </span>
      ),
    },
    {
      accessorKey: "quantitySold",
      header: "Sales",
      cell: ({ row }: { row: { original: TicketType } }) => {
        const sold = row.original.quantitySold ?? 0;
        const total = row.original.quantityTotal;
        const pct = total ? Math.round((sold / total) * 100) : null;
        return (
          <div className="flex items-center gap-3">
            <span className="font-black italic text-white">{sold}</span>
            <span className="text-[10px] font-black text-white/10 italic">/ {total ?? "∞"}</span>
            {pct !== null && (
              <Badge className="bg-white/5 text-white/40 border-white/10 rounded-full px-2 font-black text-[8px] uppercase">{pct}%</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: TicketType } }) => {
        const status = row.original.status as string;
        const variantMap: Record<string, string> = {
          active: "bg-green-500/10 text-green-500 border-green-500/20",
          paused: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          sold_out: "bg-red-500/10 text-red-500 border-red-500/20",
          archived: "bg-white/10 text-white/30 border-white/10",
        };
        return (
          <Badge className={cn("rounded-full px-3 py-0.5 font-black text-[9px] uppercase tracking-widest border italic", variantMap[status] || "")}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: TicketType } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex justify-end">
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/5 border border-white/5 text-white/20 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] p-2 bg-slate-950 border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
            <DropdownMenuItem 
              onClick={() => { setSelectedTicket(row.original); setIsModalOpen(true); }}
              className="rounded-xl font-black italic uppercase tracking-widest text-[9px] focus:bg-white/10 focus:text-white py-3 gap-3"
            >
              <Edit className="h-3.5 w-3.5 text-primary" /> Edit Ticket Type
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5 mx-2 my-2" />
            <DropdownMenuItem 
              onClick={() => setDeleteId(row.original.id)}
              className="rounded-xl font-black italic uppercase tracking-widest text-[9px] text-red-500 focus:bg-red-500/10 focus:text-red-400 py-3 gap-3"
            >
              <Trash className="h-3.5 w-3.5" /> Delete Ticket Type
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Tickets</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Manage ticket types and inventory
          </p>
        </motion.div>
        
        <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3" onClick={() => { setSelectedTicket(null); setIsModalOpen(true); }}>
          <Plus className="h-6 w-6" />
          Create Ticket Type
        </Button>
      </div>

      {!isLoading && tickets.length === 0 ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-[40px] bg-white/5 border border-white/10 p-20 text-center space-y-8"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-primary/10 text-primary rotate-12 group-hover:rotate-0 transition-transform">
            <Ticket className="h-10 w-10 -rotate-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">No Ticket Types Yet</h3>
            <p className="max-w-xs mx-auto text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
              Create ticket tiers for this event so guests can register or staff can issue tickets manually.
            </p>
          </div>
          <Button className="h-14 px-10 rounded-2xl bg-white/10 hover:bg-primary text-white font-black italic uppercase tracking-widest transition-all" onClick={() => { setSelectedTicket(null); setIsModalOpen(true); }}>
            Create First Ticket Type
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
           <DataTable
            columns={columns}
            data={tickets}
            searchKey="name"
            searchPlaceholder="Filter ticket types..."
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {/* Modals */}
      <TicketTypeModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventId={eventId}
        ticketType={selectedTicket ?? undefined}
        onSuccess={refetch}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[40px] border border-white/10 shadow-2xl p-12 bg-slate-950 max-w-xl">
          <AlertDialogHeader className="space-y-6">
            <div className="h-16 w-16 rounded-[28px] bg-red-500/10 flex items-center justify-center text-red-500 shadow-2xl shadow-red-500/10">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Delete Ticket Type</AlertDialogTitle>
              <AlertDialogDescription className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
                This action permanently deletes the selected ticket type. Existing sales and issued tickets may be affected.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-10 flex flex-row items-center justify-end gap-4">
            <AlertDialogCancel className="h-14 px-8 rounded-2xl border-white/5 bg-white/5 text-white/40 hover:text-white font-black italic uppercase tracking-widest text-xs mt-0 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="h-14 px-10 rounded-2xl font-black bg-red-500 hover:bg-red-600 text-white shadow-2xl shadow-red-500/20 italic text-xs transition-all hover:scale-105 active:scale-95"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

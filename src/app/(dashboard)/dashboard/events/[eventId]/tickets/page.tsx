"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, MoreHorizontal, Edit, Trash, AlertCircle } from "lucide-react";
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
        <div>
          <span className="font-semibold">{row.original.name}</span>
          {row.original.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }: { row: { original: TicketType } }) => (
        <span className="font-mono font-medium">
          {row.original.price === 0 || row.original.price === null ? (
            <Badge variant="secondary">Free</Badge>
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
          <div>
            <span className="font-medium">{sold}</span>
            <span className="text-muted-foreground"> / {total ?? "∞"}</span>
            {pct !== null && (
              <span className="ml-2 text-xs text-muted-foreground">({pct}%)</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "saleStartsAt",
      header: "Sale Period",
      cell: ({ row }: { row: { original: TicketType } }) => {
        const starts = row.original.saleStartsAt;
        const ends = row.original.saleEndsAt;
        if (!starts && !ends) return <span className="text-muted-foreground text-xs">Always on sale</span>;
        return (
          <div className="text-xs text-muted-foreground">
            {starts && <div>From {format(new Date(starts as string), "MMM d")}</div>}
            {ends && <div>Until {format(new Date(ends as string), "MMM d")}</div>}
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
          active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
          sold_out: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
        };
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${variantMap[status] ?? ""}`}>
            {status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: TicketType } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex justify-end">
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-1 bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 shadow-xl">
            <DropdownMenuItem 
              onClick={() => {
                setSelectedTicket(row.original);
                setIsModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <Edit className="h-4 w-4 text-primary" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />
            <DropdownMenuItem 
              onClick={() => setDeleteId(row.original.id)}
              className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/5"
            >
              <Trash className="h-4 w-4" /> Delete Type
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!isLoading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ticket Types</h1>
            <p className="text-muted-foreground">Manage pricing tiers and ticket availability.</p>
          </div>
          <Button className="gap-2 rounded-2xl px-6 h-11 shadow-xl shadow-primary/20" onClick={() => {
            setSelectedTicket(null);
            setIsModalOpen(true);
          }}>
            <Plus className="h-4 w-4" /> Create Ticket
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Ticket className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No ticket types created</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Set up different pricing tiers, Early Bird specials, or VIP packages to start selling tickets online.
          </p>
          <Button className="mt-6 rounded-2xl px-8 h-12 shadow-xl shadow-primary/20 font-bold" onClick={() => {
            setSelectedTicket(null);
            setIsModalOpen(true);
          }}>Create Ticket Type</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ticket Types</h1>
          <p className="text-muted-foreground">
            {tickets.length} ticket type{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2 rounded-2xl px-6 h-11 shadow-xl shadow-primary/20" onClick={() => {
          setSelectedTicket(null);
          setIsModalOpen(true);
        }}>
          <Plus className="h-4 w-4" /> Create Ticket
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        searchKey="name"
        searchPlaceholder="Search ticket types..."
        isLoading={isLoading}
      />
      <TicketTypeModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventId={eventId}
        ticketType={selectedTicket ?? undefined}
        onSuccess={refetch}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 bg-white dark:bg-zinc-950">
          <AlertDialogHeader className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle className="text-2xl font-bold">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-md">
                This action cannot be undone. This will permanently delete the ticket type and remove it from all sales channels.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 flex flex-row items-center justify-end gap-3">
            <AlertDialogCancel className="h-12 px-6 rounded-2xl border-2 font-bold mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="h-12 px-8 rounded-2xl font-black bg-destructive hover:bg-destructive/90 text-white shadow-xl shadow-destructive/20 min-w-[120px]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

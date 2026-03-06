"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, MoreHorizontal, Eye, Edit, Trash2, Copy, CalendarDays, Archive } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";

type Event = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "cancelled" | "completed";
  eventType: "single" | "recurring" | "multi_day" | "session" | "conference";
  startsAt: string;
  endsAt: string | null;
  maxCapacity: number | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

import { motion } from "framer-motion";

export default function EventsPage() {
  const router = useRouter();
  type EventStatus = "draft" | "published" | "cancelled" | "completed";
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");

  const { data, isLoading, refetch } = trpc.events.list.useQuery(
    statusFilter !== "all"
      ? { status: statusFilter }
      : undefined
  );

  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const duplicateEvent = trpc.events.duplicate.useMutation({
    onSuccess: (event) => {
      toast.success("Event duplicated");
      router.push(`/dashboard/events/${event.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const archiveEvent = trpc.events.archive.useMutation({
    onSuccess: () => {
      toast.success("Event archived");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const columns: ColumnDef<Event>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Event Information",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Link
            href={`/dashboard/events/${row.original.id}`}
            className="font-bold text-white hover:text-primary transition-colors text-base"
          >
            {row.original.title}
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-white/5 border-white/10 text-white/40">
              {row.original.eventType.replace("_", " ")}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "startsAt",
      header: "Schedule",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white/90">{format(new Date(row.original.startsAt), "EEE, MMM d, yyyy")}</span>
          <span className="text-xs font-medium text-white/40">
            {format(new Date(row.original.startsAt), "h:mm a")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Current Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            className={cn(
              "rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[10px] border-none",
              status === "published" ? "bg-green-500/20 text-green-400" :
              status === "draft" ? "bg-amber-500/20 text-amber-400" :
              status === "cancelled" ? "bg-red-500/20 text-red-400" :
              "bg-white/10 text-white/40"
            )}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "maxCapacity",
      header: "Attendance",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">
            {row.original.maxCapacity ?? "Unlimited"}
          </span>
          <span className="text-[10px] text-white/20 uppercase font-black">Capacity</span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px] p-2 rounded-2xl bg-[#1A1C30] border-white/10 text-white">
            <DropdownMenuItem
              className="rounded-xl focus:bg-white/10 focus:text-white"
              onClick={() =>
                router.push(`/dashboard/events/${row.original.id}`)
              }
            >
              <Eye className="mr-2 h-4 w-4 text-primary" /> View
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl focus:bg-white/10 focus:text-white"
              onClick={() =>
                router.push(`/dashboard/events/${row.original.id}/settings`)
              }
            >
              <Edit className="mr-2 h-4 w-4 text-primary" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl focus:bg-white/10 focus:text-white"
              onClick={() => duplicateEvent.mutate({ id: row.original.id })}
            >
              <Copy className="mr-2 h-4 w-4 text-primary" /> Duplicate
            </DropdownMenuItem>
            {row.original.status !== "completed" && (
              <DropdownMenuItem
                className="rounded-xl focus:bg-white/10 focus:text-white"
                onClick={() => archiveEvent.mutate({ id: row.original.id })}
              >
                <Archive className="mr-2 h-4 w-4 text-primary" /> Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              className="text-red-400 rounded-xl focus:bg-red-500/10 focus:text-red-400"
              onClick={() => deleteEvent.mutate({ id: row.original.id })}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const events = (data?.events ?? []) as Event[];

  if (!isLoading && events.length === 0 && statusFilter === "all") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl max-w-xl w-full"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6 group">
            <CalendarDays className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 italic tracking-tight">Create Magic</h1>
          <p className="text-white/40 mb-10 text-lg leading-relaxed">
            Get started by creating your first event. You can set up check-ins,
            guest lists, and vibrant ticketing experiences.
          </p>
          <Link href="/dashboard/events/new">
            <Button size="lg" className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1">
              Create Your First Event
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">Events</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            {data?.total ?? 0} active event{(data?.total ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="h-14 px-8 rounded-2xl bg-white text-[#1A1C30] hover:bg-white/90 font-black text-base shadow-2xl transition-all hover:-translate-y-1 flex gap-3">
            <Plus className="h-6 w-6" />
            New Event
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={events}
        searchKey="title"
        searchPlaceholder="Find an event..."
        isLoading={isLoading}
        toolbar={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EventStatus | "all")}>
            <SelectTrigger className="h-12 w-[180px] bg-white/5 border-white/10 rounded-2xl text-white font-bold focus:ring-primary">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1C30] border-white/10 text-white rounded-2xl">
              <SelectItem value="all" className="rounded-xl">All statuses</SelectItem>
              <SelectItem value="draft" className="rounded-xl">Draft</SelectItem>
              <SelectItem value="published" className="rounded-xl">Published</SelectItem>
              <SelectItem value="cancelled" className="rounded-xl">Cancelled</SelectItem>
              <SelectItem value="completed" className="rounded-xl">Completed</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}

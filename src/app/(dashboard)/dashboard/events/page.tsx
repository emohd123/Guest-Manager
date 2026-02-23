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
      accessorKey: "title",
      header: "Event",
      cell: ({ row }) => (
        <div>
          <Link
            href={`/dashboard/events/${row.original.id}`}
            className="font-medium hover:text-primary hover:underline"
          >
            {row.original.title}
          </Link>
          <p className="text-xs text-muted-foreground capitalize">
            {row.original.eventType.replace("_", " ")}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "startsAt",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-sm">
          <p>{format(new Date(row.original.startsAt), "MMM d, yyyy")}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(row.original.startsAt), "h:mm a")}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={statusColors[row.original.status]}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "maxCapacity",
      header: "Capacity",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.maxCapacity ?? "Unlimited"}
        </span>
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
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/events/${row.original.id}`)
              }
            >
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/events/${row.original.id}/settings`)
              }
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => duplicateEvent.mutate({ id: row.original.id })}
            >
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            {row.original.status !== "completed" && (
              <DropdownMenuItem
                onClick={() => archiveEvent.mutate({ id: row.original.id })}
              >
                <Archive className="mr-2 h-4 w-4" /> Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Events</h1>
            <p className="text-muted-foreground">
              Manage your events, guest lists, and check-ins.
            </p>
          </div>
          <Link href="/dashboard/events/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Event
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No events yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Get started by creating your first event. You can set up check-in,
            guest lists, and ticketing.
          </p>
          <Link href="/dashboard/events/new" className="mt-6">
            <Button>Create Your First Event</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">
            {data?.total ?? 0} event{(data?.total ?? 0) !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Event
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={events}
        searchKey="title"
        searchPlaceholder="Search events..."
        isLoading={isLoading}
        toolbar={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EventStatus | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}

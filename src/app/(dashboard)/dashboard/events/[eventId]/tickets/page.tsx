"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket } from "lucide-react";
import { format } from "date-fns";

export default function TicketsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data: ticketTypesList, isLoading } = trpc.ticketTypes.list.useQuery({ eventId });

  const tickets = ticketTypesList ?? [];

  const columns = [
    {
      accessorKey: "name",
      header: "Ticket Type",
      cell: ({ row }: any) => (
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
      cell: ({ row }: any) => (
        <span className="font-mono font-medium">
          {row.original.price === 0 ? (
            <Badge variant="secondary">Free</Badge>
          ) : (
            `$${(row.original.price / 100).toFixed(2)}`
          )}
        </span>
      ),
    },
    {
      accessorKey: "quantitySold",
      header: "Sales",
      cell: ({ row }: any) => {
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
      cell: ({ row }: any) => {
        const starts = row.original.saleStartsAt;
        const ends = row.original.saleEndsAt;
        if (!starts && !ends) return <span className="text-muted-foreground text-xs">Always on sale</span>;
        return (
          <div className="text-xs text-muted-foreground">
            {starts && <div>From {format(new Date(starts), "MMM d")}</div>}
            {ends && <div>Until {format(new Date(ends), "MMM d")}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
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
  ];

  if (!isLoading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ticket Types</h1>
            <p className="text-muted-foreground">Manage pricing tiers and ticket availability.</p>
          </div>
          <Button className="gap-2">
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
          <Button className="mt-6">Create Ticket Type</Button>
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
        <Button className="gap-2">
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
    </div>
  );
}

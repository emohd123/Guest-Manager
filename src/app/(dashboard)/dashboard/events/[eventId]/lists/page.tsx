"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";

import { use } from "react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";

export default function GuestListsPage({ params }: { params: Promise<{ eventId: string }> }) {
  use(params); // consume the promise to avoid React warnings, but eventId is unused here

  const { data, isLoading } = trpc.lists.list.useQuery({
    limit: 50,
  });

  const lists = data?.lists ?? [];

  const columns = [
    {
      accessorKey: "name",
      header: "List Name",
    },
    {
      accessorKey: "contactCount",
      header: "Total Contacts",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: any) => <span>{format(new Date(row.original.createdAt), "MMM d, yyyy")}</span>
    },
  ];

  if (!isLoading && lists.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Guest Lists</h1>
            <p className="text-muted-foreground">Organize attendees into specific actionable lists.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create List
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <List className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No guest lists found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Create lists for VIPs, press passes, staff, or specific sponsors to generate isolated check-in views.
          </p>
          <Button className="mt-6">Create New List</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guest Lists</h1>
          <p className="text-muted-foreground">
            {lists.length} list{lists.length !== 1 ? "s" : ""} active
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Create List
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={lists}
        searchKey="name"
        searchPlaceholder="Search lists..."
        isLoading={isLoading}
      />
    </div>
  );
}

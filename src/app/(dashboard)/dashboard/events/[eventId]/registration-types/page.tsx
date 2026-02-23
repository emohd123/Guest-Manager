"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Ticket } from "lucide-react";

export default function RegistrationTypesPage() {
  const isLoading = false;
  const types: any[] = []; // Empty for now

  const columns = [
    {
      accessorKey: "name",
      header: "Registration Type",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <span className="capitalize">{row.original.status}</span>
    },
  ];

  if (!isLoading && types.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Registration Types</h1>
            <p className="text-muted-foreground">Define different categories of attendees.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Type
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Ticket className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No registration types</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Create categories like "Staff", "VIP", or "Exhibitor" to better organize your guests and customize their experience.
          </p>
          <Button className="mt-6">Create Registration Type</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registration Types</h1>
          <p className="text-muted-foreground">
            {types.length} type{types.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Type
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={types}
        searchKey="name"
        searchPlaceholder="Search registration types..."
        isLoading={isLoading}
      />
    </div>
  );
}

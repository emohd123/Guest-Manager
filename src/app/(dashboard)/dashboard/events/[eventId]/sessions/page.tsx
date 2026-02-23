"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";

export default function SessionsPage() {
  const isLoading = false;
  const sessions: any[] = []; // Empty for now

  const columns = [
    {
      accessorKey: "title",
      header: "Session Title",
    },
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "startTime",
      header: "Time",
      cell: ({ row }: any) => <span>{row.original.startTime} - {row.original.endTime}</span>
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "capacity",
      header: "Capacity",
    },
  ];

  if (!isLoading && sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sessions</h1>
            <p className="text-muted-foreground">Manage schedule blocks, workshops, and multi-track events.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Session
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No sessions scheduled</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Break your event into smaller, trackable time blocks or locations to manage check-ins independently.
          </p>
          <Button className="mt-6">Create First Session</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Session
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        searchKey="title"
        searchPlaceholder="Search sessions..."
        isLoading={isLoading}
      />
    </div>
  );
}

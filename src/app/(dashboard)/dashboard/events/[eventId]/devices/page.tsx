"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Smartphone, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { use } from "react";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc/client";

export default function DevicesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  
  const { data, isLoading } = trpc.devices.list.useQuery({
    eventId,
    limit: 50,
  });

  const devices = data?.devices ?? [];

  const columns = [
    {
      accessorKey: "name",
      header: "Device Name",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === "online" ? "default" : "secondary"} className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "battery",
      header: "Battery",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{row.original.battery}%</span>
        </div>
      ),
    },
    {
      accessorKey: "appVersion",
      header: "App Version",
    },
    {
      accessorKey: "lastSyncAt",
      header: "Last Sync",
      cell: ({ row }: any) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {row.original.lastSyncAt ? formatDistanceToNow(new Date(row.original.lastSyncAt), { addSuffix: true }) : "Never"}
        </span>
      )
    },
  ];

  if (!isLoading && devices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Devices</h1>
            <p className="text-muted-foreground">Manage scanning devices and check connectivity.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Device
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No devices connected</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Download the Check-in app on your phones or tablets and link them to this event to start scanning tickets.
          </p>
          <Button className="mt-6">Link a Device</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Devices</h1>
          <p className="text-muted-foreground">
            {devices.length} device{devices.length !== 1 ? "s" : ""} connected
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Device
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={devices}
        searchKey="name"
        searchPlaceholder="Search devices..."
        isLoading={isLoading}
      />
    </div>
  );
}

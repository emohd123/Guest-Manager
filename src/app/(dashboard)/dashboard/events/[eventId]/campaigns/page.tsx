"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";

import { use } from "react";
import { trpc } from "@/lib/trpc/client";

export default function EventCampaignsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data, isLoading } = trpc.campaigns.list.useQuery({
    eventId,
    limit: 50,
  });

  const campaigns = data?.campaigns ?? [];

  const columns = [
    {
      accessorKey: "name",
      header: "Campaign Name",
      cell: ({ row }: any) => (
        <div>
          <span className="font-semibold block">{row.original.name}</span>
          {row.original.subject && (
            <span className="text-xs text-muted-foreground line-clamp-1">{row.original.subject}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => <span className="uppercase text-xs font-bold">{row.original.type}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <span className="capitalize">{row.original.status}</span>
    },
    {
      accessorKey: "sentCount",
      header: "Metrics",
      cell: ({ row }: any) => (
        <span className="text-xs">
          {row.original.sentCount} sent / {row.original.openedCount} opened
        </span>
      )
    },
  ];

  if (!isLoading && campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Event Campaigns</h1>
            <p className="text-muted-foreground">Marketing blasts specific to this event&apos;s audience.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No active campaigns</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Launch focused SMS or Email marketing blasts specifically targeted to users interacting with this event.
          </p>
          <Button className="mt-6">Create Campaign</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Campaigns</h1>
          <p className="text-muted-foreground">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={campaigns}
        searchKey="name"
        searchPlaceholder="Search event campaigns..."
        isLoading={isLoading}
      />
    </div>
  );
}

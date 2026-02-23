"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";

export default function CampaignsPage() {
  const { data, isLoading } = trpc.campaigns.list.useQuery({});

  const columns = [
    {
      accessorKey: "name",
      header: "Campaign Name",
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
  ];

  const campaigns = data?.campaigns ?? [];

  if (!isLoading && campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground">Manage your Email and SMS marketing blasts.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No campaigns yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Get started by launching your first marketing campaign to your contacts.
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
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            {data?.total ?? 0} campaign{(data?.total ?? 0) !== 1 ? "s" : ""}
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
        searchPlaceholder="Search campaigns..."
        isLoading={isLoading}
      />
    </div>
  );
}

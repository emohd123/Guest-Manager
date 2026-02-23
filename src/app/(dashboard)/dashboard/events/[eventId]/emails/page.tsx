"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";

import { use } from "react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";

export default function SentEmailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  // Re-using the campaigns router as our generalized communications log
  const { data, isLoading } = trpc.campaigns.list.useQuery({
    eventId,
    limit: 50,
  });

  const emails = data?.campaigns ?? [];

  const columns = [
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }: any) => (
        <div>
          <span className="font-semibold block">{row.original.subject || row.original.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.type}</span>
        </div>
      )
    },
    {
      accessorKey: "sentCount",
      header: "Recipients",
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }: any) => <span>{format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a")}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <span className="capitalize">{row.original.status}</span>
    },
  ];

  if (!isLoading && emails.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sent Emails</h1>
            <p className="text-muted-foreground">Track all automated and manual communications sent to attendees.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Compose Email
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No emails sent yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Send ticket confirmations, pre-event reminders, or post-event surveys. Sent emails will appear here.
          </p>
          <Button className="mt-6">Create New Email</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sent Emails</h1>
          <p className="text-muted-foreground">
            {emails.length} email{emails.length !== 1 ? "s" : ""} logged
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Compose Email
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={emails}
        searchKey="subject"
        searchPlaceholder="Search email subjects..."
        isLoading={isLoading}
      />
    </div>
  );
}

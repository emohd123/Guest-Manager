"use client";
import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Mail, RefreshCw, Star, Filter, X, LayoutTemplate } from "lucide-react";
import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";

export default function SentEmailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data, isLoading } = trpc.sentEmails.list.useQuery({
    eventId,
    limit: 100,
  });

  const emails = data?.emails ?? [];

  const columns = [
    {
      id: "select",
      header: ({ table }: { table: any }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: any }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: { row: any }) => <span className="text-muted-foreground whitespace-nowrap">{row.original.type}</span>
    },
    {
      accessorKey: "state",
      header: "State",
      cell: ({ row }: { row: any }) => (
        <span className="text-green-600 font-medium">{row.original.state}</span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <span>{row.original.status}</span>
      )
    },
    {
      accessorKey: "emailAddress",
      header: "Email",
      cell: ({ row }: { row: any }) => (
        <a href={`mailto:${row.original.emailAddress}`} className="text-blue-500 hover:underline max-w-[250px] truncate inline-block">
          {row.original.emailAddress}
        </a>
      )
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }: { row: any }) => <div className="text-muted-foreground max-w-[200px] truncate">{row.original.subject}</div>
    },
    {
      accessorKey: "openCount",
      header: () => <div className="whitespace-nowrap">Open count</div>,
      cell: ({ row }: { row: any }) => <div className="whitespace-nowrap text-center">{row.original.openCount}</div>
    },
    {
      accessorKey: "clickCount",
      header: () => <div className="whitespace-nowrap">Click count</div>,
      cell: ({ row }: { row: any }) => <div className="whitespace-nowrap text-center">{row.original.clickCount}</div>
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }: { row: any }) => <span>{row.original.reason || ""}</span>
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button variant="outline" size="sm" className="h-8 shadow-none">View</Button>
          <Button variant="outline" size="sm" className="h-8 shadow-none">Activity</Button>
          <Button variant="outline" size="sm" className="h-8 shadow-none">Resend</Button>
        </div>
      )
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
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
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
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700">Create New Email</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ghost header matching GuestManager UI */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2 h-9">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <div className="relative">
            <Input placeholder="Search by email address..." className="w-64 h-9 pr-8" />
          </div>
          <Button variant="ghost" className="h-9 font-normal">
            <X className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9">Summary</Button>
          <Button variant="outline" className="h-9">Select</Button>
          <Button variant="outline" className="h-9">Actions</Button>
          <Button variant="outline" className="h-9 gap-2">
            <LayoutTemplate className="h-4 w-4" /> Columns
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <DataTable
          columns={columns}
          data={emails}
          searchKey="emailAddress"
          searchPlaceholder="Search email addresses..."
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

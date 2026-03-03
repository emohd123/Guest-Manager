"use client";
import * as React from "react";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Mail, RefreshCw, Star, Filter, X, LayoutTemplate } from "lucide-react";
import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function SentEmailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data, isLoading } = trpc.sentEmails.list.useQuery({
    eventId,
    limit: 100,
  });

  const [viewingEmail, setViewingEmail] = React.useState<any | null>(null);
  const [activityEmail, setActivityEmail] = React.useState<any | null>(null);
  const [resendingEmail, setResendingEmail] = React.useState<any | null>(null);
  
  const utils = trpc.useUtils();
  const resendMutation = trpc.sentEmails.resend.useMutation({
    onSuccess: () => {
      utils.sentEmails.list.invalidate();
      setResendingEmail(null);
    },
    onError: (err) => {
      alert("Failed to resend: " + err.message);
    }
  });

  const syncMutation = trpc.sentEmails.syncStatus.useMutation({
    onSuccess: (result) => {
      utils.sentEmails.list.invalidate();
      if (result.synced === 0) {
        alert("No emails with a Resend ID found to sync (emails may not have a resendId stored).");
      }
    },
    onError: (err) => {
      alert("Sync failed: " + err.message);
    },
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
      accessorKey: "state",
      header: "State",
      cell: ({ row }: { row: any }) => (
        <span className="text-green-600 font-medium text-xs">{row.original.state}</span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <span className="text-xs">{row.original.status}</span>
      )
    },
    {
      accessorKey: "emailAddress",
      header: "Email",
      cell: ({ row }: { row: any }) => (
        <a href={`mailto:${row.original.emailAddress}`} className="text-blue-500 hover:underline max-w-[180px] truncate inline-block text-xs">
          {row.original.emailAddress}
        </a>
      )
    },
    {
      accessorKey: "openCount",
      header: () => <div className="text-center">Opens</div>,
      cell: ({ row }: { row: any }) => <div className="text-center">{row.original.openCount}</div>
    },
    {
      accessorKey: "clickCount",
      header: () => <div className="text-center">Clicks</div>,
      cell: ({ row }: { row: any }) => <div className="text-center">{row.original.clickCount}</div>
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }: { row: any }) => <span className="text-xs text-muted-foreground">{row.original.reason || "—"}</span>
    },
    {
      id: "actions",
      header: () => <div className="text-right w-full pr-2">Actions</div>,
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" className="h-7 shadow-none text-xs px-2" onClick={() => setViewingEmail(row.original)}>View</Button>
          <Button variant="outline" size="sm" className="h-7 shadow-none text-xs px-2" onClick={() => setActivityEmail(row.original)}>Activity</Button>
          <Button variant="outline" size="sm" className="h-7 shadow-none text-xs px-2" onClick={() => setResendingEmail(row.original)}>Resend</Button>
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
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate({ eventId })}
            title="Sync email statuses from Resend"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
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
          isLoading={isLoading}
        />
      </div>

      <Dialog open={!!viewingEmail} onOpenChange={(o) => !o && setViewingEmail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Summary</DialogTitle>
            <DialogDescription>Details about this message.</DialogDescription>
          </DialogHeader>
          {viewingEmail && (
            <div className="space-y-4 text-sm mt-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-right col-span-1 border-r pr-4">Sent to</span>
                <span className="col-span-3">{viewingEmail.emailAddress}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-right col-span-1 border-r pr-4">Subject</span>
                <span className="col-span-3">{viewingEmail.subject}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-right col-span-1 border-r pr-4">Status</span>
                <span className="col-span-3">{viewingEmail.status} ({viewingEmail.state})</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-semibold text-right col-span-1 border-r pr-4">Date</span>
                <span className="col-span-3">{format(new Date(viewingEmail.createdAt), "PP pp")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!activityEmail} onOpenChange={(o) => !o && setActivityEmail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Activity</DialogTitle>
            <DialogDescription>Timeline of interactions for ({activityEmail?.emailAddress}).</DialogDescription>
          </DialogHeader>
          {activityEmail && (
            <div className="space-y-6 mt-4 relative border-l-2 border-muted ml-4 pl-6 pb-2">
              <div className="relative">
                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-background" />
                <h4 className="text-sm font-semibold">Message Created</h4>
                <p className="text-xs text-muted-foreground">{format(new Date(activityEmail.createdAt), "PP pp")}</p>
              </div>
              
              <div className="relative">
                <div className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-background ${activityEmail.state === 'Delivered' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <h4 className="text-sm font-semibold">{activityEmail.state === 'Delivered' ? 'Message Delivered' : 'Sending...'}</h4>
                <p className="text-xs text-muted-foreground">{format(new Date(activityEmail.updatedAt), "PP pp")}</p>
                {activityEmail.reason && <p className="text-xs text-destructive mt-1">{activityEmail.reason}</p>}
              </div>

              {activityEmail.openCount > 0 && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-purple-500 ring-4 ring-background" />
                  <h4 className="text-sm font-semibold">Message Opened</h4>
                  <p className="text-xs text-muted-foreground">{activityEmail.openCount} total {activityEmail.openCount === 1 ? 'open' : 'opens'}</p>
                </div>
              )}
              
              {activityEmail.clickCount > 0 && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-orange-500 ring-4 ring-background" />
                  <h4 className="text-sm font-semibold">Link Clicked</h4>
                  <p className="text-xs text-muted-foreground">{activityEmail.clickCount} total {activityEmail.clickCount === 1 ? 'click' : 'clicks'}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resendingEmail} onOpenChange={(o) => !o && setResendingEmail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Email</DialogTitle>
            <DialogDescription>
              Are you sure you want to resend this &quot;{resendingEmail?.type}&quot; to {resendingEmail?.emailAddress}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setResendingEmail(null)}>Cancel</Button>
            <Button 
              disabled={resendMutation.isPending}
              onClick={() => {
                if (resendingEmail) {
                  resendMutation.mutate({ emailAddress: resendingEmail.emailAddress, eventId });
                }
              }}
            >
              {resendMutation.isPending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, use } from "react";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Upload, FileUp, Calendar, User, Database, CheckCircle2, XCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { ImportWizard } from "@/components/imports/ImportWizard";
import { Badge } from "@/components/ui/badge";

export default function ImportsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.dataImports.list.useQuery({ eventId });
  const imports = data?.dataImports ?? [];

  const columns = [
    {
      accessorKey: "filename",
      header: "File Name",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <Database className="h-4 w-4 text-zinc-500" />
          </div>
          <span className="font-semibold">{row.original.filename}</span>
        </div>
      )
    },
    {
      accessorKey: "recordsProcessed",
      header: "Records",
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.recordsProcessed} / {row.original.totalRecords}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Processed</span>
        </div>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Date Imported",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="text-sm">{format(new Date(row.original.createdAt), "MMM d, h:mm a")}</span>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.original.status;
        if (status === "completed") {
          return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0 h-6 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Success</Badge>;
        }
        if (status === "failed") {
          return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2 py-0 h-6 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" /> Failed</Badge>;
        }
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 py-0 h-6 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> {status}</Badge>;
      }
    },
  ];

  const handleOpenWizard = () => setIsWizardOpen(true);

  return (
    <div className="space-y-6 container py-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Imports</h1>
          <p className="text-muted-foreground mt-1">
            Manage your audience bulk uploads and synchronization history.
          </p>
        </div>
        <Button onClick={handleOpenWizard} className="gap-2 h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
          <Upload className="h-4 w-4" /> New Import
        </Button>
      </div>

      {!isLoading && imports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-24 text-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 transition-transform hover:scale-110 duration-300">
            <FileUp className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mt-8 text-2xl font-bold tracking-tight">No previous imports</h3>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Quickly add thousands of guests to your event. Upload a CSV file and we'll help you map the columns in seconds.
          </p>
          <Button onClick={handleOpenWizard} className="mt-10 h-12 px-10 rounded-xl font-bold uppercase tracking-widest text-xs">
            Start First Import
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <DataTable
            columns={columns}
            data={imports}
            searchKey="filename"
            searchPlaceholder="Search your import logs..."
            isLoading={isLoading}
          />
        </div>
      )}

      <ImportWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        eventId={eventId}
        onSuccess={refetch}
      />
    </div>
  );
}

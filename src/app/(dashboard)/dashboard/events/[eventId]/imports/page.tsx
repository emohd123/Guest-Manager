"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Upload, FileUp } from "lucide-react";

export default function ImportsPage() {
  const isLoading = false;
  const imports: any[] = []; // Empty for now

  const columns = [
    {
      accessorKey: "filename",
      header: "File Name",
    },
    {
      accessorKey: "recordsProcessed",
      header: "Records",
    },
    {
      accessorKey: "importedDate",
      header: "Date Imported",
    },
    {
      accessorKey: "importedBy",
      header: "User",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <span className="capitalize">{row.original.status}</span>
    },
  ];

  if (!isLoading && imports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Data Imports</h1>
            <p className="text-muted-foreground">Import guests and lists via CSV or Excel.</p>
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" /> New Import
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors">
            <FileUp className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No previous imports</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Bulk upload thousands of guests at once. Click the button above to upload a .csv file and map your columns.
          </p>
          <Button className="mt-6">Start CSV Import</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Imports</h1>
          <p className="text-muted-foreground">
            {imports.length} import log{imports.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" /> New Import
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={imports}
        searchKey="filename"
        searchPlaceholder="Search filenames..."
        isLoading={isLoading}
      />
    </div>
  );
}

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { ScanLine } from "lucide-react";
import { format } from "date-fns";

export default function ScansPage() {
  const { data, isLoading } = trpc.scans.list.useQuery({});

  const columns = [
    {
      accessorKey: "scanType",
      header: "Type",
      cell: ({ row }: any) => <span className="capitalize">{row.original.scanType.replace("_", " ")}</span>
    },
    {
      accessorKey: "barcode",
      header: "Barcode",
    },
    {
      accessorKey: "scannedAt",
      header: "Scanned At",
      cell: ({ row }: any) => format(new Date(row.original.scannedAt), "MMM d, yyyy h:mm a"),
    },
  ];

  const scans = data?.scans ?? [];

  if (!isLoading && scans.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scans (Audit Log)</h1>
            <p className="text-muted-foreground">Real-time check-in and checkout scan logs.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No scans recorded</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Ticket scanning logs will appear here when guests are checked in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scans (Audit Log)</h1>
          <p className="text-muted-foreground">
            {data?.total ?? 0} scan{(data?.total ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={scans}
        searchKey="barcode"
        searchPlaceholder="Search barcodes..."
        isLoading={isLoading}
      />
    </div>
  );
}

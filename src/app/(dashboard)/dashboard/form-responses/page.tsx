"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export default function FormResponsesPage() {
  const { data, isLoading } = trpc.formResponses.list.useQuery({});

  const columns = [
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }: any) => format(new Date(row.original.submittedAt), "MMM d, yyyy h:mm a"),
    },
    {
      id: "details",
      header: "Response Details",
      cell: () => "View JSON format...",
    }
  ];

  const responses = data?.formResponses ?? [];

  if (!isLoading && responses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Form Responses</h1>
            <p className="text-muted-foreground">Review custom data submitted via event forms.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No responses yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Form responses will appear here once guests submit their data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Form Responses</h1>
          <p className="text-muted-foreground">
            {data?.total ?? 0} response{(data?.total ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={responses}
        isLoading={isLoading}
      />
    </div>
  );
}

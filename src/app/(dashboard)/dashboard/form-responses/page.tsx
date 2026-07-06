"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { FileText, Activity } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/shared/empty-state";

export default function FormResponsesPage() {
  const { data, isLoading } = trpc.formResponses.list.useQuery({});

  const columns = [
    {
      accessorKey: "submittedAt",
      header: "Timestamp",
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="font-black italic text-foreground dark:text-white uppercase tracking-tight leading-none mb-1">
            {format(new Date(row.original.submittedAt), "HH:mm:ss")}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground dark:text-white/20 uppercase tracking-widest">
            {format(new Date(row.original.submittedAt), "MMM d, yyyy")}
          </span>
        </div>
      ),
    },
    {
      id: "details",
      header: "Details",
      cell: () => (
        <span className="font-black italic text-primary uppercase text-[10px] tracking-widest cursor-pointer hover:underline">
          VIEW RESPONSE
        </span>
      ),
    },
  ];

  const responses = data?.formResponses ?? [];

  return (
    <div className="space-y-12 pb-20 px-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-foreground dark:text-white italic tracking-tighter uppercase leading-none">
            Form Responses
          </h1>
          <p className="text-muted-foreground dark:text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary animate-pulse" />
            Responses submitted from guest forms
          </p>
        </motion.div>
      </div>

      {!isLoading && responses.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Responses Yet"
          description="Responses submitted through your event forms will appear here."
        />
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <DataTable
            columns={columns}
            data={responses}
            isLoading={isLoading}
            searchKey="submittedAt"
            searchPlaceholder="Search responses..."
          />
        </motion.div>
      )}
    </div>
  );
}

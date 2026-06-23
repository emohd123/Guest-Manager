"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ScanLine, Activity } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function ScansPage() {
  const { data, isLoading } = trpc.scans.list.useQuery({});

  const columns = [
    {
      accessorKey: "scanType",
      header: "Scan Type",
      cell: ({ row }: any) => <span className="font-black italic text-primary uppercase text-[10px] tracking-widest leading-none">{row.original.scanType.replace("_", " ")}</span>
    },
    {
      accessorKey: "barcode",
      header: "Ticket Code",
      cell: ({ row }: any) => <span className="font-mono text-[10px] font-bold text-white/40 uppercase tracking-widest">{row.original.barcode}</span>
    },
    {
      accessorKey: "scannedAt",
      header: "Scanned At",
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="font-black italic text-white uppercase tracking-tight leading-none mb-1">
            {format(new Date(row.original.scannedAt), "HH:mm:ss")}
          </span>
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
            {format(new Date(row.original.scannedAt), "MMM d, yyyy")}
          </span>
        </div>
      ),
    },
  ];

  const scans = data?.scans ?? [];

  return (
    <div className="space-y-12 pb-20 px-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Scans</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Ticket scan activity
          </p>
        </motion.div>
      </div>

      {!isLoading && scans.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title="No Scans Yet"
          description="No ticket scans have been recorded yet."
        />
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
           <DataTable
            columns={columns}
            data={scans}
            searchKey="barcode"
            searchPlaceholder="Search ticket codes..."
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </div>
  );
}

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function SessionsPage() {
  const isLoading = false;
  const sessions: any[] = []; // Empty for now

  const columns = [
    {
      accessorKey: "title",
      header: "Operation Block",
      cell: ({ row }: any) => <span className="font-black italic text-white uppercase tracking-tight">{row.original.title}</span>
    },
    {
      accessorKey: "date",
      header: "Deployment Date",
      cell: ({ row }: any) => <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">{row.original.date}</span>
    },
    {
      accessorKey: "startTime",
      header: "Active Window",
      cell: ({ row }: any) => <span className="font-black italic text-primary uppercase text-[10px] tracking-widest">{row.original.startTime} — {row.original.endTime}</span>
    },
    {
      accessorKey: "location",
      header: "Zone",
      cell: ({ row }: any) => <span className="uppercase text-[10px] font-black text-white/40 tracking-widest">{row.original.location}</span>
    },
    {
      accessorKey: "capacity",
      header: "Threshold",
      cell: ({ row }: any) => <span className="font-black italic text-white tracking-widest">{row.original.capacity}</span>
    },
  ];

  return (
    <div className="space-y-12 pb-20 px-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Sessions</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Tactical Schedule Partitioning
          </p>
        </motion.div>
        <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
          <Plus className="h-6 w-6" />
          Add Block
        </Button>
      </div>

      {!isLoading && sessions.length === 0 ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-[40px] bg-white/5 border border-white/10 p-20 text-center space-y-8"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-primary/10 text-primary rotate-12 group-hover:rotate-0 transition-transform">
            <CalendarDays className="h-10 w-10 -rotate-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Schedule Void</h3>
            <p className="max-w-xs mx-auto text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
              No tactical blocks scheduled. Partition your event into manageable time zones for streamlined logistics.
            </p>
          </div>
          <Button className="h-14 px-10 rounded-2xl bg-white/10 hover:bg-primary text-white font-black italic uppercase tracking-widest transition-all">
            Initialize First Block
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
           <DataTable
            columns={columns}
            data={sessions}
            searchKey="title"
            searchPlaceholder="Filter mission blocks..."
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </div>
  );
}

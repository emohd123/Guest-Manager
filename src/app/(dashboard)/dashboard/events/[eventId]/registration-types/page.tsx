"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Ticket, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/shared/empty-state";

export default function RegistrationTypesPage() {
  const isLoading = false;
  const types: any[] = []; // Empty for now

  const columns = [
    {
      accessorKey: "name",
      header: "Guest Type",
      cell: ({ row }: any) => <span className="font-black italic text-white uppercase tracking-tight">{row.original.name}</span>
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }: any) => <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">{row.original.description}</span>
    },
    {
      accessorKey: "status",
      header: "Current State",
      cell: ({ row }: any) => <span className="uppercase text-[10px] font-black text-primary tracking-widest italic">{row.original.status}</span>
    },
  ];

  return (
    <div className="space-y-12 pb-20 px-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Guest Types</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Ticket and guest categories
          </p>
        </motion.div>
        <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
          <Plus className="h-6 w-6" />
          Add Guest Type
        </Button>
      </div>

      {!isLoading && types.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No Guest Types Yet"
          description="No guest types have been created yet. Add categories such as VIP, Staff, or Attendee."
          action={
            <Button className="h-14 px-10 rounded-2xl border border-cyan-500/30 bg-cyan-600 text-white font-black italic uppercase tracking-widest shadow-lg shadow-cyan-600/20 transition-all hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:bg-slate-300 disabled:text-slate-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:focus-visible:ring-cyan-300 dark:disabled:bg-white/10 dark:disabled:text-white/40">
              Add First Guest Type
            </Button>
          }
        />
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
           <DataTable
            columns={columns}
            data={types}
            searchKey="name"
            searchPlaceholder="Search guest types..."
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </div>
  );
}

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Ticket, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function RegistrationTypesPage() {
  const isLoading = false;
  const types: any[] = []; // Empty for now

  const columns = [
    {
      accessorKey: "name",
      header: "Registry Classification",
      cell: ({ row }: any) => <span className="font-black italic text-white uppercase tracking-tight">{row.original.name}</span>
    },
    {
      accessorKey: "description",
      header: "Role Clearance",
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
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Class</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Tactical Unit Classification
          </p>
        </motion.div>
        <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
          <Plus className="h-6 w-6" />
          Add Classification
        </Button>
      </div>

      {!isLoading && types.length === 0 ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-[40px] bg-white/5 border border-white/10 p-20 text-center space-y-8"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-primary/10 text-primary rotate-12 group-hover:rotate-0 transition-transform">
            <Ticket className="h-10 w-10 -rotate-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Registry Empty</h3>
            <p className="max-w-xs mx-auto text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
              No classifications defined. Categorize your units into clear logistical tiers like VIP, Staff, or Attendee.
            </p>
          </div>
          <Button className="h-14 px-10 rounded-2xl bg-white/10 hover:bg-primary text-white font-black italic uppercase tracking-widest transition-all">
            Define Level 01
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
           <DataTable
            columns={columns}
            data={types}
            searchKey="name"
            searchPlaceholder="Filter classifications..."
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </div>
  );
}

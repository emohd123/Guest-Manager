"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";
import { motion } from "framer-motion";

export default function CampaignsPage() {
  const { data, isLoading } = trpc.campaigns.list.useQuery({});

  const columns = [
    {
      accessorKey: "name",
      header: "Campaign Name",
      cell: ({ row }: any) => <span className="font-black italic text-white">{row.original.name}</span>
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => <span className="uppercase text-[10px] font-black text-white/40 tracking-widest">{row.original.type}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <span className="capitalize font-bold text-primary">{row.original.status}</span>
    },
  ];

  const campaigns = data?.campaigns ?? [];

  return (
    <div className="space-y-12 pb-20 px-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Broadcasting</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Multi-channel marketing relay
          </p>
        </motion.div>
        <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
          <Plus className="h-6 w-6" />
          New Campaign
        </Button>
      </div>

      {!isLoading && campaigns.length === 0 ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-[40px] bg-white/5 border border-white/10 p-20 text-center space-y-8"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-primary/10 text-primary rotate-12 group-hover:rotate-0 transition-transform">
            <Megaphone className="h-10 w-10 -rotate-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Silence Detected</h3>
            <p className="max-w-sm text-[10px] font-bold text-white/20 uppercase tracking-widest">
              Awaiting your first broadcast transmission to the operational grid.
            </p>
          </div>
          <Button className="h-14 px-10 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black italic uppercase tracking-widest transition-all">
            Initialize Payload
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
           <DataTable
            columns={columns}
            data={campaigns}
            searchKey="name"
            searchPlaceholder="Search campaigns..."
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </div>
  );
}

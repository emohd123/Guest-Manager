"use client";

import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Tag, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/shared/empty-state";

export default function PromotionsPage() {
  const { data, isLoading } = trpc.promotions.list.useQuery();

  const columns = [
    {
      accessorKey: "code",
      header: "Promotion Code",
      cell: ({ row }: any) => <span className="font-black italic text-white uppercase tracking-tight">{row.original.code}</span>
    },
    {
      accessorKey: "discountType",
      header: "Discount Type",
      cell: ({ row }: any) => <span className="uppercase text-[10px] font-black text-white/40 tracking-widest">{row.original.discountType}</span>
    },
    {
      accessorKey: "value",
      header: "Discount Value",
      cell: ({ row }: any) => <span className="font-black italic text-primary">{row.original.value}</span>
    },
  ];

  const promotions = data?.promotions ?? [];

  return (
    <div className="space-y-12 pb-20 px-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <motion.div
           initial={{ x: -20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Promotions</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
             <Activity className="h-3 w-3 text-primary animate-pulse" />
             Manage promo codes and discount rules
          </p>
        </motion.div>
        <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 italic flex gap-3">
          <Plus className="h-6 w-6" />
          New Promotion
        </Button>
      </div>

      {!isLoading && promotions.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No Promotions Yet"
          description="Create a promotion code to offer discounts for tickets and registrations."
          action={
            <Button className="h-14 px-10 rounded-2xl bg-white/10 hover:bg-primary text-white font-black italic uppercase tracking-widest transition-all">
              Create Promotion
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
            data={promotions}
            searchKey="code"
            searchPlaceholder="Search promotion codes..."
            isLoading={isLoading}
          />
        </motion.div>
      )}
    </div>
  );
}

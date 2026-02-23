"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";

export default function PromotionsPage() {
  const { data, isLoading } = trpc.promotions.list.useQuery();

  const columns = [
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "discountType",
      header: "Type",
    },
    {
      accessorKey: "value",
      header: "Value",
    },
  ];

  const promotions = data?.promotions ?? [];

  if (!isLoading && promotions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Promotions</h1>
            <p className="text-muted-foreground">Manage discount codes and rules.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Promotion
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Tag className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No promotions yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Get started by creating your first discount code.
          </p>
          <Button className="mt-6">Create Promotion</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">
            {data?.total ?? 0} promotion{(data?.total ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Promotion
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={promotions}
        searchKey="code"
        searchPlaceholder="Search codes..."
        isLoading={isLoading}
      />
    </div>
  );
}

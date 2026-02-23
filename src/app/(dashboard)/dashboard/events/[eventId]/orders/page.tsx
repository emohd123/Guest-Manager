"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";

import { use } from "react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";

export default function OrdersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data, isLoading } = trpc.orders.list.useQuery({
    eventId,
    limit: 50,
  });

  const orders = data?.orders ?? [];

  const columns = [
    {
      accessorKey: "orderNumber",
      header: "Order #",
    },
    {
      accessorKey: "name",
      header: "Buyer",
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }: any) => <span>{format(new Date(row.original.createdAt), "MMM d, yyyy")}</span>
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }: any) => <span>${(row.original.total / 100).toFixed(2)}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => <span className="capitalize">{row.original.status}</span>
    },
  ];

  if (!isLoading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage ticket purchases and manual orders.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            When attendees purchase tickets online or you manually create orders, they will appear here.
          </p>
          <Button className="mt-6">Create Manual Order</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchKey="buyerName"
        searchPlaceholder="Search buyer name or order #..."
        isLoading={isLoading}
      />
    </div>
  );
}

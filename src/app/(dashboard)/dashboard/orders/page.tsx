"use client";

import { useState } from "react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Download,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  cart: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data: statsData } = trpc.orders.stats.useQuery({});
  const { data, isLoading } = trpc.orders.list.useQuery({
    search: search || undefined,
    status: status !== "all" ? (status as "cart" | "pending" | "completed" | "cancelled" | "refunded") : undefined,
    limit: 50,
    offset: 0,
  });

  const totalRevenue = (statsData?.revenue ?? 0) / 100;
  const avgOrderValue = statsData?.totalOrders
    ? totalRevenue / statsData.totalOrders
    : 0;

  const orderStats = [
    {
      label: "Total Orders",
      value: (statsData?.totalOrders ?? 0).toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/50",
    },
    {
      label: "Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/50",
    },
    {
      label: "Avg Order Value",
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/50",
    },
    {
      label: "Tickets Sold",
      value: (statsData?.ticketsSold ?? 0).toString(),
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-100 dark:bg-orange-900/50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            View and manage ticket orders, refunds, and payments.
          </p>
        </div>
        <Button variant="outline" className="gap-2" disabled>
          <Download className="h-4 w-4" /> Export Orders
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {orderStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order History</CardTitle>
          <CardDescription>All ticket purchases and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or order ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data?.orders?.length ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Orders will appear here when guests purchase tickets through your
                event registration pages.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Order</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="py-3 pr-4">
                        <span className="font-mono font-medium">{order.orderNumber}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{order.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{order.email || "—"}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-medium">
                          ${((order.total ?? 0) / 100).toFixed(2)}{" "}
                          <span className="text-xs text-muted-foreground">{order.currency}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className={statusColors[order.status ?? "pending"]}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.total > data.orders.length && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Showing {data.orders.length} of {data.total} orders
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Methods</CardTitle>
          <CardDescription>Configure payment processing for ticket sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#635BFF]/10">
                <span className="text-lg font-bold text-[#635BFF]">S</span>
              </div>
              <div>
                <p className="font-medium">Stripe</p>
                <p className="text-sm text-muted-foreground">
                  Accept credit cards, Apple Pay, and Google Pay
                </p>
              </div>
            </div>
            <Badge variant="secondary">Not Connected</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

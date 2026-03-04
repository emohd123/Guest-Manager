"use client";

import {
  DollarSign,
  Download,
  Package,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";

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
      label: "Gross Revenue",
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: "+12.5%",
      sub: "Last 30 days"
    },
    {
      label: "Total Orders",
      value: (statsData?.totalOrders ?? 0).toString(),
      icon: ShoppingCart,
      trend: "+5.2%",
      sub: "Active orders"
    },
    {
      label: "Tickets Sold",
      value: (statsData?.ticketsSold ?? 0).toString(),
      icon: Package,
      trend: "+8.1%",
      sub: "Units sold"
    },
    {
      label: "Avg Order",
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      trend: "-2.4%",
      sub: "Per customer"
    },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">Finance</h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Real-time transaction tracking
          </p>
        </div>
        <Button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black text-base transition-all hover:-translate-y-1 flex gap-3">
          <Download className="h-6 w-6" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 px-2">
        {orderStats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-[32px] bg-white/5 border border-white/10 p-8 transition-all hover:bg-white/8"
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                  <stat.icon className="h-6 w-6" />
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-none font-black text-[10px] rounded-full px-2 py-0.5">
                  {stat.trend}
                </Badge>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{stat.label}</p>
              <h2 className="text-3xl font-black text-white italic tracking-tight mb-4">{stat.value}</h2>
              <p className="text-[10px] font-bold text-white/10 uppercase tracking-tighter mt-auto">{stat.sub}</p>
            </div>
            {/* Visual Flare */}
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <h2 className="text-xl font-black text-white italic">Transaction History</h2>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="px-2 flex flex-col gap-6 sm:flex-row">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Order Number, Name or Email..."
              className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus-visible:ring-primary focus-visible:border-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-14 w-[200px] bg-white/5 border-white/10 rounded-2xl text-white font-bold focus:ring-primary">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1C30] border-white/10 text-white rounded-2xl">
              <SelectItem value="all" className="rounded-xl">All Statuses</SelectItem>
              <SelectItem value="completed" className="rounded-xl">Completed</SelectItem>
              <SelectItem value="pending" className="rounded-xl">Pending</SelectItem>
              <SelectItem value="refunded" className="rounded-xl">Refunded</SelectItem>
              <SelectItem value="cancelled" className="rounded-xl">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="rounded-[40px] bg-white/5 border border-white/10 p-20 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-white/40 font-black uppercase tracking-widest text-xs">Syncing Ledger...</p>
          </div>
        ) : !data?.orders?.length ? (
          <div className="rounded-[40px] bg-white/5 border border-white/10 p-24 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/3 mb-6">
              <Package className="h-10 w-10 text-white/10" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">No Transactions</h3>
            <p className="max-w-xs mx-auto text-white/30 text-sm">
              We couldn&apos;t find any orders matching your current filters.
            </p>
          </div>
        ) : (
          <div className="rounded-[40px] bg-white/5 border border-white/10 overflow-hidden backdrop-blur-3xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-left text-white/40 border-b border-white/5">
                    <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Reference</th>
                    <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Client</th>
                    <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Amount</th>
                    <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Status</th>
                    <th className="py-6 px-8 font-black uppercase tracking-widest text-[10px]">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.orders.map((order) => (
                    <tr key={order.id} className="group hover:bg-white/5 transition-all">
                      <td className="py-6 px-8">
                        <span className="font-mono font-black text-primary text-xs tracking-tighter">{order.orderNumber}</span>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex flex-col">
                          <p className="font-bold text-white leading-none mb-1">{order.name || "Anonymous"}</p>
                          <p className="text-[10px] font-medium text-white/40">{order.email}</p>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <span className="font-black text-white italic">
                          ${((order.total ?? 0) / 100).toFixed(2)}
                          <span className="text-[10px] opacity-20 ml-1 not-italic">USD</span>
                        </span>
                      </td>
                      <td className="py-6 px-8 text-sm">
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[10px] border-none shadow-sm",
                            order.status === "completed" ? "bg-green-500/20 text-green-400" :
                            order.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                          )}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-8 text-white/40 font-bold uppercase tracking-tighter text-[10px]">
                        {format(new Date(order.createdAt), "MMM d, HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stripe Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-[40px] bg-linear-to-br from-[#635BFF]/20 to-transparent border border-[#635BFF]/30 p-10 flex flex-col md:flex-row items-center justify-between gap-8 mx-2"
      >
        <div className="flex items-center gap-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#635BFF] shadow-2xl shadow-[#635BFF]/40">
            <span className="text-4xl font-black text-white italic">S</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white italic mb-2 tracking-tight">Stripe Gateway</h3>
            <p className="text-[#635BFF] font-bold uppercase tracking-widest text-[10px]">
              Ready for secure global transactions
            </p>
          </div>
        </div>
        <Button className="h-14 px-10 rounded-2xl bg-[#635BFF] hover:bg-[#635BFF]/90 text-white font-black text-base shadow-2xl shadow-[#635BFF]/20 transition-all hover:-translate-y-1">
          Connect Stripe
        </Button>
      </motion.div>
    </div>
  );
}

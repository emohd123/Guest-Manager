"use client";

import { use, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Armchair,
  Users,
  Search,
  ChevronRight,
  MoreVertical,
  UserPlus,
  Activity,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { GuestModal } from "@/components/guests/GuestModal";
import type { Guest } from "@/types/guest";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SeatingPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const [reservedEnabled, setReservedEnabled] = useState(false);
  const [sections, setSections] = useState<
    Array<{
      name: string;
      price: number | null;
      x: number;
      y: number;
      rows: Array<{
        label: string;
        price: number | null;
        seatCount: number;
        seatPrices?: Record<string, number>;
      }>;
    }>
  >([]);

  const { data, refetch } = trpc.guests.list.useQuery({ eventId });
  const { data: reservedPlan } = trpc.seating.get.useQuery({ eventId });
  const saveReserved = trpc.seating.save.useMutation({
    onSuccess: () => toast.success("Reserved seating plan saved"),
  });
  useEffect(() => {
    if (reservedPlan) {
      setFloorPlanUrl(reservedPlan.floor_plan_url ?? "");
      setReservedEnabled(reservedPlan.enabled);
      setSections(
        reservedPlan.sections.map((s: any) => ({
          name: s.name,
          price: s.price,
          x: s.x,
          y: s.y,
          rows: s.rows.map((r: any) => ({
            label: r.label,
            price: r.price,
            seatCount: r.seats.length,
            seatPrices: Object.fromEntries(
              r.seats
                .filter((seat: any) => seat.price != null)
                .map((seat: any) => [seat.label, seat.price]),
            ),
          })),
        })),
      );
    }
  }, [reservedPlan]);
  const guests = useMemo(() => data?.guests ?? [], [data]);

  const tableGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    guests.forEach((guest: any) => {
      const table = guest.tableNumber || "UNASSIGNED";
      if (!groups[table]) groups[table] = [];
      groups[table].push(guest);
    });
    return groups;
  }, [guests]);

  const tables = Object.entries(tableGroups).sort(([a], [b]) => {
    if (a === "UNASSIGNED") return 1;
    if (b === "UNASSIGNED") return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const filteredTables = tables.filter(([tableName, members]) => {
    if (!search) return true;
    return (
      tableName.toLowerCase().includes(search.toLowerCase()) ||
      members.some(
        (m) =>
          m.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          m.lastName?.toLowerCase().includes(search.toLowerCase()),
      )
    );
  });

  const totalGuests = guests.length;
  const assignedGuests = guests.filter(
    (g) => g.tableNumber && g.tableNumber !== "UNASSIGNED",
  ).length;
  const unassignedGuests = totalGuests - assignedGuests;
  const assignmentPercentage =
    totalGuests > 0 ? (assignedGuests / totalGuests) * 100 : 0;

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all group"
            >
              <ChevronRight className="h-6 w-6 rotate-180 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
              Venue
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
              <Activity className="h-3 w-3 text-primary animate-pulse" />
              Seating and table assignments
            </p>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white/60 hover:text-white font-black italic uppercase tracking-widest text-[10px] transition-all flex gap-3"
          >
            Export Floor Plan
          </Button>
          <Button
            className="h-12 px-8 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 font-black italic uppercase tracking-widest text-[10px] flex gap-3 transition-all hover:scale-105 active:scale-95"
            onClick={() => {
              setSelectedGuest(null);
              setIsModalOpen(true);
            }}
          >
            <UserPlus className="h-5 w-5" /> Add Guest
          </Button>
        </div>
      </div>

      <div className="rounded-[32px] border border-cyan-300/20 bg-[#08131b] p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-300">
              Reserved seating designer
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Floor plan and seat inventory
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Working first version: provide an uploaded floor-plan image URL,
              then define positioned sections, rows, seat counts and price
              overrides. The structure is ready for a future drag-and-drop
              canvas.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={reservedEnabled}
              onChange={(e) => setReservedEnabled(e.target.checked)}
            />
            Enable customer seat selection
          </label>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-white/50">
              Floor-plan image URL
            </label>
            <Input
              value={floorPlanUrl}
              onChange={(e) => setFloorPlanUrl(e.target.value)}
              placeholder="https://.../floor-plan.png"
              className="mt-2 bg-white/5 border-white/10"
            />
            {floorPlanUrl ? (
              <img
                src={floorPlanUrl}
                alt="Floor plan preview"
                className="mt-4 max-h-72 w-full rounded-2xl bg-white/5 object-contain"
              />
            ) : (
              <div className="mt-4 grid h-48 place-items-center rounded-2xl border border-dashed border-white/10 text-xs text-white/30">
                Floor-plan preview
              </div>
            )}
          </div>
          <div className="space-y-4">
            {sections.map((section, si) => (
              <div
                key={si}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid gap-2 sm:grid-cols-4">
                  <Input
                    value={section.name}
                    onChange={(e) =>
                      setSections((current) =>
                        current.map((s, i) =>
                          i === si ? { ...s, name: e.target.value } : s,
                        ),
                      )
                    }
                    placeholder="Section name"
                  />
                  <Input
                    type="number"
                    value={section.price ?? ""}
                    onChange={(e) =>
                      setSections((current) =>
                        current.map((s, i) =>
                          i === si
                            ? {
                                ...s,
                                price: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              }
                            : s,
                        ),
                      )
                    }
                    placeholder="Section price"
                  />
                  <Input
                    type="number"
                    value={section.x}
                    onChange={(e) =>
                      setSections((current) =>
                        current.map((s, i) =>
                          i === si ? { ...s, x: Number(e.target.value) } : s,
                        ),
                      )
                    }
                    placeholder="X %"
                  />
                  <Input
                    type="number"
                    value={section.y}
                    onChange={(e) =>
                      setSections((current) =>
                        current.map((s, i) =>
                          i === si ? { ...s, y: Number(e.target.value) } : s,
                        ),
                      )
                    }
                    placeholder="Y %"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {section.rows.map((row, ri) => (
                    <div
                      key={ri}
                      className="grid gap-2 sm:grid-cols-[.7fr_.7fr_.8fr_1.5fr_auto]"
                    >
                      <Input
                        value={row.label}
                        onChange={(e) =>
                          setSections((current) =>
                            current.map((s, i) =>
                              i === si
                                ? {
                                    ...s,
                                    rows: s.rows.map((r, j) =>
                                      j === ri
                                        ? { ...r, label: e.target.value }
                                        : r,
                                    ),
                                  }
                                : s,
                            ),
                          )
                        }
                        placeholder="Row A"
                      />
                      <Input
                        type="number"
                        value={row.seatCount}
                        onChange={(e) =>
                          setSections((current) =>
                            current.map((s, i) =>
                              i === si
                                ? {
                                    ...s,
                                    rows: s.rows.map((r, j) =>
                                      j === ri
                                        ? {
                                            ...r,
                                            seatCount: Number(e.target.value),
                                          }
                                        : r,
                                    ),
                                  }
                                : s,
                            ),
                          )
                        }
                        placeholder="Seats"
                      />
                      <Input
                        type="number"
                        value={row.price ?? ""}
                        onChange={(e) =>
                          setSections((current) =>
                            current.map((s, i) =>
                              i === si
                                ? {
                                    ...s,
                                    rows: s.rows.map((r, j) =>
                                      j === ri
                                        ? {
                                            ...r,
                                            price: e.target.value
                                              ? Number(e.target.value)
                                              : null,
                                          }
                                        : r,
                                    ),
                                  }
                                : s,
                            ),
                          )
                        }
                        placeholder="Row price"
                      />
                      <Input
                        value={Object.entries(row.seatPrices ?? {})
                          .map(([seat, price]) => `${seat}:${price}`)
                          .join(", ")}
                        onChange={(e) => {
                          const seatPrices = Object.fromEntries(
                            e.target.value
                              .split(",")
                              .map((value) => value.trim().split(":"))
                              .filter(
                                ([seat, price]) =>
                                  seat &&
                                  price !== undefined &&
                                  !Number.isNaN(Number(price)),
                              )
                              .map(([seat, price]) => [seat, Number(price)]),
                          );
                          setSections((current) =>
                            current.map((s, i) =>
                              i === si
                                ? {
                                    ...s,
                                    rows: s.rows.map((r, j) =>
                                      j === ri ? { ...r, seatPrices } : r,
                                    ),
                                  }
                                : s,
                            ),
                          );
                        }}
                        placeholder="Seat prices 1:25, 2:30"
                      />
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setSections((current) =>
                            current.map((s, i) =>
                              i === si
                                ? {
                                    ...s,
                                    rows: s.rows.filter((_, j) => j !== ri),
                                  }
                                : s,
                            ),
                          )
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSections((current) =>
                        current.map((s, i) =>
                          i === si
                            ? {
                                ...s,
                                rows: [
                                  ...s.rows,
                                  {
                                    label: String.fromCharCode(
                                      65 + s.rows.length,
                                    ),
                                    price: null,
                                    seatCount: 10,
                                  },
                                ],
                              }
                            : s,
                        ),
                      )
                    }
                  >
                    Add row
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSections((current) =>
                        current.filter((_, i) => i !== si),
                      )
                    }
                  >
                    Remove section
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setSections((current) => [
                  ...current,
                  {
                    name: `Section ${current.length + 1}`,
                    price: null,
                    x: 10 + current.length * 10,
                    y: 10 + current.length * 10,
                    rows: [{ label: "A", price: null, seatCount: 10 }],
                  },
                ])
              }
            >
              Add section
            </Button>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            disabled={saveReserved.isPending}
            onClick={() =>
              saveReserved.mutate({
                eventId,
                floorPlanUrl: floorPlanUrl || null,
                enabled: reservedEnabled,
                sections,
              })
            }
          >
            {saveReserved.isPending ? "Saving…" : "Save reserved seating plan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Venue Grid */}
        <div className="lg:col-span-3 space-y-10">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search tables or guests..."
              className="h-14 pl-16 pr-6 rounded-2xl bg-white/5 border-white/10 text-white font-black italic uppercase tracking-widest text-[10px] focus:ring-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredTables.map(([tableName, members], i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={tableName}
                  className="group rounded-[40px] bg-white/5 border border-white/10 p-10 hover:bg-white/8 transition-all relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-start justify-between mb-10">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110 duration-500">
                        <Armchair className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">
                          {tableName}
                        </h3>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                          {members.length} GUESTS ASSIGNED
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-white/10 hover:text-white hover:bg-white/5 rounded-xl border border-white/5"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 relative z-10">
                    {members.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/2 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group/item"
                        onClick={() => {
                          setSelectedGuest(m);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white/3 flex items-center justify-center font-black italic text-[10px] text-white/40 border border-white/5 group-hover/item:text-white transition-colors">
                            {m.firstName?.[0]}
                            {m.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-white italic truncate uppercase tracking-tight group-hover/item:text-primary transition-colors leading-none mb-1">
                              {m.firstName} {m.lastName}
                            </p>
                            <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest font-mono">
                              ID: {m.id.split("-")[0]}
                            </p>
                          </div>
                        </div>
                        {m.seatNumber && (
                          <span className="text-[10px] font-black text-primary italic uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 tracking-widest">
                            S-{m.seatNumber}
                          </span>
                        )}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <button className="w-full py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-primary hover:tracking-[0.4em] transition-all italic mt-4">
                        + {members.length - 5} MORE GUESTS
                      </button>
                    )}
                    {members.length === 0 && (
                      <div className="py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[32px]">
                        <Target className="h-10 w-10 text-white/5 mx-auto" />
                        <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">
                          NO GUESTS ASSIGNED
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="absolute right-0 bottom-0 h-32 w-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-8">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="p-8 rounded-[40px] bg-primary text-white shadow-2xl shadow-primary/20 relative overflow-hidden group"
          >
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <Activity className="h-10 w-10 text-white/40 animate-pulse" />
                <Badge className="bg-white/10 text-white border-none backdrop-blur-md px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest italic">
                  LIVE SEATING
                </Badge>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">
                  Assigned Guests
                </p>
                <div className="text-5xl font-black italic tracking-tighter leading-none">
                  {assignedGuests}{" "}
                  <span className="text-xl opacity-30">/ {totalGuests}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${assignmentPercentage}%` }}
                    className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  />
                </div>
                <p className="text-[10px] text-right font-black uppercase tracking-widest italic opacity-60">
                  {Math.round(assignmentPercentage)}% ASSIGNED
                </p>
              </div>
            </div>
            <div className="absolute -right-10 -top-10 h-48 w-48 bg-white/10 rounded-full blur-3xl" />
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-[40px] bg-white/5 border border-white/10 overflow-hidden backdrop-blur-xl"
          >
            <div className="p-8 border-b border-white/5 bg-white/2">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">
                Unassigned Guests
              </h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">
                {unassignedGuests} GUESTS WITHOUT A TABLE
              </p>
            </div>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-white/5">
                {guests
                  .filter(
                    (g) => !g.tableNumber || g.tableNumber === "UNASSIGNED",
                  )
                  .map((g) => (
                    <div
                      key={g.id}
                      className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-move"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/3 flex items-center justify-center font-black italic text-sm text-white/40 border border-white/5 group-hover:text-primary transition-colors">
                          {g.firstName?.[0]}
                          {g.lastName?.[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white uppercase tracking-tight italic leading-none mb-1 group-hover:text-primary transition-colors">
                            {g.firstName} {g.lastName}
                          </span>
                          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                            {g.guestType || "STANDARD"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-white/10 hover:text-white hover:bg-primary rounded-xl transition-all"
                        onClick={() => {
                          setSelectedGuest(g);
                          setIsModalOpen(true);
                        }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                {unassignedGuests === 0 && (
                  <div className="p-20 text-center space-y-6">
                    <div className="h-16 w-16 rounded-[32px] bg-green-500/10 text-green-500 flex items-center justify-center mx-auto transition-transform hover:scale-110">
                      <Users className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">
                        ALL GUESTS ASSIGNED
                      </h4>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">
                        Every guest has a table assignment
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <GuestModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventId={eventId}
        guest={selectedGuest}
        onSuccess={refetch}
      />
    </div>
  );
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { readSeatsIoChartKey } from "@/lib/seatsio";

export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Only a booking capability is public: never expose settings, hold owners,
// scanner credentials, or ticket identifiers to the native client.
export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  if (!z.string().uuid().safeParse(eventId).success) return reply({ error: "Invalid event" }, 400);
  try {
    const db = createSupabaseAdminClient();
    const { data: event, error } = await db.from("events").select("id,settings").eq("id", eventId).eq("status", "published").neq("event_type", "conference").is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!event || event.settings?.publicPage?.enabled === false || event.settings?.publicPage?.showInApp === false) return reply({ error: "Event unavailable" }, 404);
    if (readSeatsIoChartKey(event.settings) && process.env.NEXT_PUBLIC_SEATSIO_WORKSPACE_KEY) return reply({ eventId, hasReservedSeating: true });
    const { data: plan, error: planError } = await db.from("seating_plans").select("id").eq("event_id", eventId).eq("enabled", true).maybeSingle();
    if (planError) throw planError;
    if (!plan) return reply({ eventId, hasReservedSeating: false });
    const { data: sections, error: sectionError } = await db.from("seat_sections").select("id").eq("plan_id", plan.id);
    if (sectionError) throw sectionError;
    if (!sections?.length) return reply({ eventId, hasReservedSeating: false });
    const { data: rows, error: rowError } = await db.from("seat_rows").select("id").in("section_id", sections.map((section) => section.id));
    if (rowError) throw rowError;
    if (!rows?.length) return reply({ eventId, hasReservedSeating: false });
    const { data: seats, error: seatError } = await db.from("reserved_seats").select("id,seat_holds(status,expires_at)").in("row_id", rows.map((row) => row.id)).is("sold_ticket_id", null).eq("inventory_status", "available");
    if (seatError) throw seatError;
    const now = Date.now();
    const hasReservedSeating = (seats ?? []).some((seat) => !(seat.seat_holds ?? []).some((hold: { status: string; expires_at: string }) => hold.status === "pending" && Date.parse(hold.expires_at) > now));
    return reply({ eventId, hasReservedSeating });
  } catch {
    return reply({ error: "Booking options are temporarily unavailable" }, 503);
  }
}

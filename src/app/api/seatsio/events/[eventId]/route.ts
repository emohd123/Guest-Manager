import { NextResponse } from "next/server";
import { DEFAULT_SEATSIO_CHART_KEY, seatsIoEventKeyFor } from "@/lib/seatsio";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const secret = process.env.SEATSIO_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Seats.io is not configured" }, { status: 503 });
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const appUser = await ensureAppUserForAuthUser(supabase, user);
  if (!appUser?.companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: event } = await supabase.from("events").select("id, title").eq("id", eventId).eq("company_id", appUser.companyId).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { chartKey?: unknown; eventKey?: unknown };
  const chartKey = typeof body.chartKey === "string" && /^[A-Za-z0-9_-]{3,128}$/.test(body.chartKey)
    ? body.chartKey
    : DEFAULT_SEATSIO_CHART_KEY;
  const eventKey = typeof body.eventKey === "string" && /^[A-Za-z0-9_-]{3,128}$/.test(body.eventKey)
    ? body.eventKey
    : seatsIoEventKeyFor(eventId, chartKey);
  const response = await fetch("https://api-eu.seatsio.net/events", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` },
    body: JSON.stringify({ chartKey, eventKey }),
  });
  if (!response.ok && response.status !== 409) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json({ error: detail || "Unable to create Seats.io event" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, eventKey, chartKey });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.SEATSIO_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Seats.io is not configured" }, { status: 503 });
  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const appUser = await ensureAppUserForAuthUser(supabase, user);
  if (!appUser?.companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("company_id", appUser.companyId).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const response = await fetch("https://api-eu.seatsio.net/charts", {
    headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` },
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Unable to load Seats.io charts" }, { status: 502 });
  const payload = await response.json() as { charts?: unknown };
  const charts = Array.isArray(payload.charts) ? payload.charts : Array.isArray(payload) ? payload : [];
  return NextResponse.json({ charts: charts.map((chart: any) => ({ key: chart.key, name: chart.name ?? chart.key })).filter((chart) => typeof chart.key === "string") });
}

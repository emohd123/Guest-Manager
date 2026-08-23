import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUserForAuthUser } from "@/server/auth/app-user";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ chartKey: string }> }) {
  const secret = process.env.SEATSIO_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Seats.io is not configured" }, { status: 503 });
  const { chartKey } = await params;
  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId || !/^[A-Za-z0-9_-]{3,128}$/.test(chartKey)) {
    return NextResponse.json({ error: "eventId and chartKey are required" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const appUser = await ensureAppUserForAuthUser(supabase, user);
  if (!appUser?.companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("company_id", appUser.companyId).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const response = await fetch(`https://api-eu.seatsio.net/charts/${encodeURIComponent(chartKey)}/categories`, {
    headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json({ error: detail || "Unable to load chart categories" }, { status: 502 });
  }
  const payload = await response.json().catch(() => []);
  const categories = Array.isArray(payload) ? payload : Array.isArray((payload as { items?: unknown[] }).items) ? (payload as { items: unknown[] }).items : [];
  return NextResponse.json({ categories: categories.map((category: any) => ({
    key: String(category.key),
    label: category.label ?? String(category.key),
    color: category.color ?? "#64748b",
    hasSelectableObjects: Boolean(category.hasSelectableObjects),
  })) });
}

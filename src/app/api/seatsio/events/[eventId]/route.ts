import { NextResponse } from "next/server";
import { DEFAULT_SEATSIO_CHART_KEY } from "@/lib/seatsio";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const secret = process.env.SEATSIO_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Seats.io is not configured" }, { status: 503 });
  const { eventId } = await params;
  const body = await request.json().catch(() => ({})) as { chartKey?: unknown };
  const chartKey = typeof body.chartKey === "string" && /^[A-Za-z0-9_-]{3,128}$/.test(body.chartKey)
    ? body.chartKey
    : DEFAULT_SEATSIO_CHART_KEY;
  const response = await fetch("https://api-eu.seatsio.net/events", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` },
    body: JSON.stringify({ chartKey, eventKey: eventId }),
  });
  if (!response.ok && response.status !== 409) return NextResponse.json({ error: "Unable to create Seats.io event" }, { status: 502 });
  return NextResponse.json({ ok: true });
}

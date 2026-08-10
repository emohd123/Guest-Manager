import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: { eventId: string } }) {
  const secret = process.env.SEATSIO_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Seats.io is not configured" }, { status: 503 });
  const response = await fetch("https://api-eu.seatsio.net/events", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` },
    body: JSON.stringify({ chartKey: "68f78e07-c80b-5a1a-2f28-a696ec3d4113", eventKey: params.eventId }),
  });
  if (!response.ok && response.status !== 409) return NextResponse.json({ error: "Unable to create Seats.io event" }, { status: 502 });
  return NextResponse.json({ ok: true });
}

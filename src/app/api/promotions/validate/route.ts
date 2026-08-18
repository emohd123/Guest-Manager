import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike } from "drizzle-orm";
import { getDb } from "@/server/db";
import { companies, events, promotions } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { companySlug?: string; eventSlug?: string; code?: string; ticketCount?: number };
    const code = body.code?.trim().toUpperCase();
    const ticketCount = Number(body.ticketCount);
    if (!body.companySlug || !body.eventSlug || !code || !Number.isInteger(ticketCount) || ticketCount < 1) {
      return NextResponse.json({ error: "Enter a valid promo code." }, { status: 400 });
    }
    const db = getDb();
    const company = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, body.companySlug)).limit(1);
    const event = company[0] ? await db.select({ id: events.id }).from(events).where(and(eq(events.companyId, company[0].id), eq(events.slug, body.eventSlug), eq(events.status, "published"))).limit(1) : [];
    const promotion = event[0] ? await db.select().from(promotions).where(and(eq(promotions.companyId, company[0].id), eq(promotions.eventId, event[0].id), ilike(promotions.code, code), eq(promotions.isActive, true))).limit(1) : [];
    const promo = promotion[0];
    const now = new Date();
    if (!promo || (promo.startsAt && promo.startsAt > now) || (promo.endsAt && promo.endsAt < now)) {
      return NextResponse.json({ error: "This promo code is not active." }, { status: 404 });
    }
    if (promo.maxUses != null && ticketCount > promo.maxUses) {
      return NextResponse.json({ error: `This promo code is limited to ${promo.maxUses} tickets.` }, { status: 400 });
    }
    return NextResponse.json({ code: promo.code, percentage: Number(promo.value), maxTickets: promo.maxUses });
  } catch {
    return NextResponse.json({ error: "Could not validate promo code." }, { status: 500 });
  }
}

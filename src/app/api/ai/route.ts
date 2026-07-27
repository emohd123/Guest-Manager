export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { runAi, type AiRequestBody } from "@/server/ai/marketplace-ai";
import type { MarketplaceDiscoveryResponse } from "@/types/marketplace";

/**
 * iTicket AI endpoint.
 * Grounds every answer in the live marketplace via the existing discover API,
 * then routes to Claude (when ANTHROPIC_API_KEY is set) or the smart fallback.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AiRequestBody;

    if (!body?.mode) {
      return NextResponse.json({ error: "mode is required" }, { status: 400 });
    }

    // Grounding data: reuse the discover endpoint (same origin self-fetch)
    // so AI answers always match what the marketplace actually shows.
    let events: MarketplaceDiscoveryResponse["events"] = [];
    if (body.mode === "concierge" || body.mode === "event-qa") {
      const discoverUrl = new URL(
        `/api/events/discover?limit=48&locale=${body.locale === "ar" ? "ar" : "en"}`,
        request.nextUrl.origin
      );
      const discoverResponse = await fetch(discoverUrl, { cache: "no-store" });
      if (discoverResponse.ok) {
        const data = (await discoverResponse.json()) as MarketplaceDiscoveryResponse;
        events = data.events ?? [];
      }
    }

    const result = await runAi(body, events);

    // Return full event objects for the recommended IDs so the client can
    // render cards without a second round trip.
    const recommended = events.filter((event) => result.eventIds.includes(event.id));

    return NextResponse.json({
      reply: result.reply,
      source: result.source,
      events: recommended,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI request failed" },
      { status: 500 }
    );
  }
}

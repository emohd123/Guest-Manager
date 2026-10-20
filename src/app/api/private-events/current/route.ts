import { NextRequest, NextResponse } from "next/server";
import {
  privateEventAccessCookie,
} from "@/server/services/private-event-access";
import { readVerifiedPrivateEventAccess } from "@/server/services/verified-private-event-access";

export async function GET(request: NextRequest) {
  const access = await readVerifiedPrivateEventAccess(
    request.cookies.get(privateEventAccessCookie.name)?.value,
  );
  if (!access) return NextResponse.json({ portalUrl: null });
  const portal = access.role === "speaker" ? "speaker-portal" : "portal";
  return NextResponse.json({
    eventId: access.eventId,
    portalUrl: `/private-event/${portal}/${access.eventId}`,
  });
}

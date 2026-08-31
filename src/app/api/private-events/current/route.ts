import { NextRequest, NextResponse } from "next/server";
import {
  privateEventAccessCookie,
  readPrivateEventAccess,
} from "@/server/services/private-event-access";

export async function GET(request: NextRequest) {
  const access = readPrivateEventAccess(
    request.cookies.get(privateEventAccessCookie.name)?.value,
  );
  if (!access) return NextResponse.json({ portalUrl: null });
  const portal = access.role === "speaker" ? "speaker-portal" : "portal";
  return NextResponse.json({
    portalUrl: `/private-event/${portal}/${access.eventId}`,
  });
}

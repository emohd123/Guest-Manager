import { NextRequest, NextResponse } from "next/server";
import { getPrivateConferenceSpeakerData } from "@/server/services/event-app";
import { privateEventAccessCookie, readPrivateEventAccess } from "@/server/services/private-event-access";

function speakerAccess(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const access = readPrivateEventAccess(bearer ?? request.cookies.get(privateEventAccessCookie.name)?.value);
  return access?.role === "speaker" ? access : null;
}

export async function GET(request: NextRequest) {
  const access = speakerAccess(request);
  if (!access?.speakerName) return NextResponse.json({ error: "Speaker access is required." }, { status: 401 });
  try {
    return NextResponse.json(await getPrivateConferenceSpeakerData({ eventId: access.eventId, speakerName: access.speakerName }));
  } catch {
    return NextResponse.json({ error: "We could not load the speaker portal." }, { status: 500 });
  }
}

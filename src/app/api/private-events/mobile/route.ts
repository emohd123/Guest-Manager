import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getPrivateConferenceMobileData,
  updatePrivateConferenceAgenda,
} from "@/server/services/event-app";
import {
  privateEventAccessCookie,
  readPrivateEventAccess,
} from "@/server/services/private-event-access";

function getAccess(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return readPrivateEventAccess(bearer ?? request.cookies.get(privateEventAccessCookie.name)?.value);
}

const agendaSchema = z.object({
  sessionId: z.string().uuid(),
  saved: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const access = getAccess(request);
    if (!access) return NextResponse.json({ error: "Your conference access has expired." }, { status: 401 });
    const data = await getPrivateConferenceMobileData({
      eventId: access.eventId,
      guestId: access.guestId,
      attendeeName: access.username,
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "We could not load this conference." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = getAccess(request);
    if (!access) return NextResponse.json({ error: "Your conference access has expired." }, { status: 401 });
    const input = agendaSchema.parse(await request.json());
    const result = await updatePrivateConferenceAgenda({
      eventId: access.eventId,
      guestId: access.guestId,
      ...input,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a valid conference session." }, { status: 400 });
    }
    return NextResponse.json({ error: "We could not update your agenda." }, { status: 400 });
  }
}

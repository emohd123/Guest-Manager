import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createConferenceQuestion } from "@/server/services/event-app";
import {
  privateEventAccessCookie,
} from "@/server/services/private-event-access";
import { readVerifiedPrivateEventAccess } from "@/server/services/verified-private-event-access";

const inputSchema = z.object({
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  body: z.string().trim().min(1).max(600),
});

export async function POST(request: NextRequest) {
  try {
    const input = inputSchema.parse(await request.json());
    const bearer = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");
    const access = await readVerifiedPrivateEventAccess(
      bearer ?? request.cookies.get(privateEventAccessCookie.name)?.value,
    );
    if (
      !access ||
      access.eventId !== input.eventId ||
      access.role === "speaker"
    ) {
      return NextResponse.json(
        { error: "Your private event access has expired." },
        { status: 401 },
      );
    }
    const question = await createConferenceQuestion({
      ...input,
      attendeeGuestId: access.guestId,
      attendeeName: access.username,
    });
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Enter a question of up to 600 characters."
        : "We could not send your question. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

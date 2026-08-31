import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getPrivateConferenceSpeakerData,
  updateSpeakerConferenceQuestion,
} from "@/server/services/event-app";
import {
  privateEventAccessCookie,
  readPrivateEventAccess,
} from "@/server/services/private-event-access";

function speakerAccess(request: NextRequest) {
  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const access = readPrivateEventAccess(
    bearer ?? request.cookies.get(privateEventAccessCookie.name)?.value,
  );
  return access?.role === "speaker" ? access : null;
}

export async function GET(request: NextRequest) {
  const access = speakerAccess(request);
  if (!access?.speakerName)
    return NextResponse.json(
      { error: "Speaker access is required." },
      { status: 401 },
    );
  try {
    return NextResponse.json(
      await getPrivateConferenceSpeakerData({
        eventId: access.eventId,
        speakerName: access.speakerName,
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "We could not load the speaker portal." },
      { status: 500 },
    );
  }
}

const questionSchema = z.object({
  questionId: z.string().uuid(),
  status: z.enum(["open", "answered"]),
});

export async function PATCH(request: NextRequest) {
  const access = speakerAccess(request);
  if (!access?.speakerName)
    return NextResponse.json(
      { error: "Speaker access is required." },
      { status: 401 },
    );
  try {
    const input = questionSchema.parse(await request.json());
    const question = await updateSpeakerConferenceQuestion({
      eventId: access.eventId,
      speakerName: access.speakerName,
      ...input,
    });
    return NextResponse.json({ question });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Choose a valid question." },
        { status: 400 },
      );
    return NextResponse.json(
      { error: "We could not update this question." },
      { status: 400 },
    );
  }
}

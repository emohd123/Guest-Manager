import { NextRequest, NextResponse } from "next/server";
import { getConferenceQuestions, getEventExperience } from "@/server/services/event-app";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId") ?? "";
  const sessionId = request.nextUrl.searchParams.get("sessionId") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (!eventId || !sessionId || !code) return NextResponse.json({ error: "Session access is required." }, { status: 401 });
  try {
    const experience = await getEventExperience(eventId);
    const session = experience.sessions.find((item) => item.id === sessionId);
    if (!session || !session.speakerAccessCode || session.speakerAccessCode !== code) {
      return NextResponse.json({ error: "This speaker access code is not valid." }, { status: 401 });
    }
    const questions = (await getConferenceQuestions(eventId)).filter((question) => question.sessionId === sessionId);
    return NextResponse.json({ session: { id: session.id, title: session.title, speaker: session.speaker }, questions });
  } catch {
    return NextResponse.json({ error: "We could not load speaker questions." }, { status: 500 });
  }
}

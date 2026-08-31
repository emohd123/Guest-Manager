import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SpeakerPortalClient } from "@/components/private-event/speaker-portal-client";
import { privateEventAccessCookie, readPrivateEventAccess } from "@/server/services/private-event-access";

export default async function SpeakerPortalPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const cookieStore = await cookies();
  const access = readPrivateEventAccess(cookieStore.get(privateEventAccessCookie.name)?.value);
  if (!access || access.role !== "speaker" || access.eventId !== eventId) redirect(`/private-event/access/${eventId}`);
  return <SpeakerPortalClient />;
}

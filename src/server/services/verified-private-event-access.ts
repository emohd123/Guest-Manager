import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { conferenceHasEnded, readPrivateEventAccess } from "./private-event-access";

// Check the current conference as well as the signed token. This also revokes
// previously issued sessions when an event is ended early or unpublished.
export async function readVerifiedPrivateEventAccess(token?: string) {
  const access = readPrivateEventAccess(token);
  if (!access) return null;
  const { data: event, error } = await createSupabaseAdminClient()
    .from("events")
    .select("id,ends_at,settings")
    .eq("id", access.eventId)
    .eq("event_type", "conference")
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("Conference access could not be verified.");
  if (!event || conferenceHasEnded(event.ends_at) || event.settings?.publicPage?.enabled === false) return null;
  return access;
}

import { createSupabaseAdminClient } from "@/server/supabase/admin";

/**
 * Push registry for the public Discover app (pre-auth marketplace users).
 * Tokens land in `discover_push_tokens`; publishing an event broadcasts a
 * "new event" push to every registered device via Expo's push API.
 */

export async function registerDiscoverPushToken(input: {
  token: string;
  platform?: string;
  installationId?: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("discover_push_tokens").upsert(
    {
      token: input.token,
      platform: input.platform ?? null,
      installation_id: input.installationId ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );
  if (error) throw new Error(error.message);
}

export async function broadcastNewEventPush(event: {
  id: string;
  title: string;
}): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("discover_push_tokens").select("token");
    if (error) throw new Error(error.message);

    const tokens = [...new Set((data ?? []).map((row) => row.token).filter(Boolean))];
    if (tokens.length === 0) return;
    console.log(`[discover-push] Broadcasting "${event.title}" to ${tokens.length} device(s)`);

    // Expo accepts up to 100 messages per request.
    for (let i = 0; i < tokens.length; i += 100) {
      const chunk = tokens.slice(i, i + 100);
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(
          chunk.map((to) => ({
            to,
            title: "New event in Bahrain 🎉",
            body: event.title,
            data: { eventId: event.id, type: "new_event" },
          }))
        ),
      });
    }
  } catch (pushError) {
    // Broadcasting must never break the publish flow.
    console.error("[discover-push] Broadcast failed:", pushError);
  }
}

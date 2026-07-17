import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { generateEventTagline } from "@/server/ai/marketplace-ai";

/**
 * Push registry for the public Discover app (pre-auth marketplace users).
 * Tokens land in `discover_push_tokens`; publishing an event broadcasts a
 * "new event" push to every registered device via Expo's push API.
 */

export async function registerDiscoverPushToken(input: {
  token: string;
  platform?: string;
  installationId?: string;
  /** Category slugs the user engages with — used to target broadcasts. */
  categories?: string[];
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("discover_push_tokens").upsert(
    {
      token: input.token,
      platform: input.platform ?? null,
      installation_id: input.installationId ?? null,
      categories: input.categories?.length ? input.categories : null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );
  if (error) throw new Error(error.message);
}

/**
 * Runs after an event transitions to published: resolves the category slug,
 * generates + stores the AI card tagline, then broadcasts the push.
 * Fire-and-forget from the mutation — must never throw.
 */
export async function handleEventPublished(event: {
  id: string;
  title: string;
  categoryId?: string | null;
  description?: string | null;
}): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();

    let categorySlug: string | null = null;
    if (event.categoryId) {
      const { data } = await admin
        .from("categories")
        .select("slug")
        .eq("id", event.categoryId)
        .maybeSingle();
      categorySlug = (data as { slug?: string | null } | null)?.slug ?? null;
    }

    const tagline = await generateEventTagline({
      title: event.title,
      description: event.description,
      category: categorySlug,
    });
    if (tagline) {
      const { data: row } = await admin.from("events").select("metadata").eq("id", event.id).maybeSingle();
      const metadata =
        row && typeof (row as { metadata?: unknown }).metadata === "object" && (row as { metadata?: unknown }).metadata
          ? ((row as { metadata: Record<string, unknown> }).metadata)
          : {};
      await admin.from("events").update({ metadata: { ...metadata, aiTagline: tagline } }).eq("id", event.id);
      console.log(`[discover-push] Tagline for "${event.title}": ${tagline}`);
    }

    await broadcastNewEventPush({ id: event.id, title: event.title }, categorySlug);
  } catch (error) {
    console.error("[discover-push] post-publish failed:", error);
  }
}

export async function broadcastNewEventPush(
  event: {
    id: string;
    title: string;
  },
  categorySlug?: string | null
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("discover_push_tokens").select("token,categories");
    if (error) throw new Error(error.message);

    // Category targeting: devices with recorded interests only get events in
    // those categories; devices without preferences receive everything.
    const rows = (data ?? []) as { token: string; categories: string[] | null }[];
    const tokens = [
      ...new Set(
        rows
          .filter((row) => {
            if (!row.categories || row.categories.length === 0) return true;
            if (!categorySlug) return true;
            return row.categories.includes(categorySlug);
          })
          .map((row) => row.token)
          .filter(Boolean)
      ),
    ];
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

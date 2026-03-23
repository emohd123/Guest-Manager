import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createUnavailableSupabaseClient, getSupabaseEnv } from "./shared";

export async function createClient() {
  const cookieStore = await cookies();
  const env = getSupabaseEnv();

  if (!env) {
    return createUnavailableSupabaseClient(
      "Supabase is not configured for this deployment."
    );
  }

  return createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

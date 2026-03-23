import { createBrowserClient } from "@supabase/ssr";
import { createUnavailableSupabaseClient, getSupabaseEnv } from "./shared";

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    return createUnavailableSupabaseClient(
      "Supabase is not configured for this deployment."
    );
  }

  return createBrowserClient(env.url, env.anonKey);
}

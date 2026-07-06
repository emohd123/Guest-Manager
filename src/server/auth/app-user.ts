import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";

type AppUser = {
  id: string;
  company_id: string | null;
};

export async function ensureAppUserForAuthUser(
  supabase: SupabaseClient,
  authUser: SupabaseUser
) {
  const { data, error } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const appUser = data as AppUser | null;
  if (!appUser?.company_id) {
    return null;
  }

  return {
    id: appUser.id,
    companyId: appUser.company_id,
  };
}

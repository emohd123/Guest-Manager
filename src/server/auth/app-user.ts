import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";

type AppUser = {
  id: string;
  company_id: string | null;
  role: "owner" | "admin" | "manager" | "staff" | null;
  dashboard_access: "none" | "limited" | "full" | null;
  dashboard_permissions: string[] | null;
};

export async function ensureAppUserForAuthUser(
  supabase: SupabaseClient,
  authUser: SupabaseUser
) {
  let { data, error } = await supabase
    .from("users")
    .select("id, company_id, role, dashboard_access, dashboard_permissions")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error && /dashboard_access|dashboard_permissions/i.test(error.message)) {
    const fallback = await supabase.from("users").select("id, company_id, role").eq("id", authUser.id).maybeSingle();
    data = fallback.data as typeof data;
    error = fallback.error;
  }
  if (error) {
    throw new Error(error.message);
  }

  const appUser = data as AppUser | null;
  const access = appUser?.dashboard_access ?? (appUser?.company_id && (appUser.role === "owner" || appUser.role === "admin") ? "full" : "none");
  if (!appUser?.company_id || access === "none") {
    return null;
  }

  return {
    id: appUser.id,
    companyId: appUser.company_id,
    role: appUser.role,
    dashboardAccess: access,
    dashboardPermissions: appUser.dashboard_permissions ?? [],
  };
}

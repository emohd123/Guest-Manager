import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

type AppUser = {
  id: string;
  company_id: string | null;
  role: "owner" | "admin" | "manager" | "staff" | null;
  dashboard_access: "none" | "limited" | "full" | null;
  dashboard_permissions: string[] | null;
  customer_company_id: string | null;
};

export async function ensureAppUserForAuthUser(
  supabase: SupabaseClient,
  authUser: SupabaseUser
) {
  let { data, error } = await supabase
    .from("users")
    .select("id, company_id, role, dashboard_access, dashboard_permissions, customer_company_id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error && /dashboard_access|dashboard_permissions/i.test(error.message)) {
    const fallback = await supabase.from("users").select("id, company_id, role, customer_company_id").eq("id", authUser.id).maybeSingle();
    data = fallback.data as typeof data;
    error = fallback.error;
  }
  if (error) {
    throw new Error(error.message);
  }

  let appUser = data as AppUser | null;
  let customerCompanyId = appUser?.customer_company_id ?? null;
  const verifiedEmail = authUser.email_confirmed_at ? authUser.email : null;
  // Link a customer account by email on first dashboard session. This is
  // server-side only; the customer email is never trusted from the browser.
  const isPrivilegedAccount = appUser?.role === "owner" || appUser?.role === "admin" || appUser?.dashboard_access === "full";
  if (appUser?.company_id && !customerCompanyId && verifiedEmail && !isPrivilegedAccount) {
    const match = await supabase.from("customer_companies").select("id").eq("owner_company_id", appUser.company_id).ilike("email", verifiedEmail).is("deleted_at", null).maybeSingle();
    if (match.data?.id) {
      customerCompanyId = match.data.id;
      await supabase.from("users").update({ customer_company_id: customerCompanyId, dashboard_access: "limited" }).eq("id", authUser.id);
    }
  }
  // A customer account may not have an application-user row yet. Match its
  // verified auth email to a company contact and provision a limited row.
  if ((!appUser || !customerCompanyId) && verifiedEmail && !isPrivilegedAccount) {
    // Customer-company rows are intentionally hidden from customer accounts by
    // RLS. Use the server-only service client for this exact email match; the
    // service key never reaches the browser and is only used during auth setup.
    let lookup = supabase;
    try {
      lookup = createSupabaseAdminClient() as SupabaseClient;
    } catch {
      // Local environments may not have a service key; the normal client still
      // works for an already-linked user and keeps this path non-fatal.
    }
    const match = await lookup
      .from("customer_companies")
      .select("id,owner_company_id")
      .ilike("email", verifiedEmail)
      .is("deleted_at", null)
      .maybeSingle();
    if (match.data?.id && match.data.owner_company_id) {
      if (appUser) {
        const linked = await supabase
          .from("users")
          .update({ customer_company_id: match.data.id, dashboard_access: "limited" })
          .eq("id", appUser.id)
          .select("id,company_id,role,dashboard_access,dashboard_permissions,customer_company_id")
          .maybeSingle();
        if (linked.data) {
          appUser = linked.data as AppUser;
          customerCompanyId = match.data.id;
        }
      } else {
        const created = await supabase.from("users").upsert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? authUser.email,
          company_id: match.data.owner_company_id,
          customer_company_id: match.data.id,
          role: "staff",
          dashboard_access: "limited",
          dashboard_permissions: ["events.read", "events.operate"],
        }, { onConflict: "id" }).select("id,company_id,role,dashboard_access,dashboard_permissions,customer_company_id").single();
        if (created.data) {
          appUser = created.data as AppUser;
          customerCompanyId = match.data.id;
        }
      }
    }
  }
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
    customerCompanyId,
  };
}

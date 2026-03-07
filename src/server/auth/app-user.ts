import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";

type AppUser = {
  id: string;
  company_id: string | null;
};

function slugifyCompanyName(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "company";
}

function getDisplayName(authUser: SupabaseUser): string | null {
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
  const metadataName = typeof metadata?.name === "string" ? metadata.name.trim() : "";
  if (metadataName) return metadataName;
  if (authUser.email) {
    return authUser.email.split("@")[0] ?? null;
  }
  return null;
}

function getCompanyName(authUser: SupabaseUser): string {
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
  const metadataCompanyName =
    typeof metadata?.company_name === "string" ? metadata.company_name.trim() : "";
  if (metadataCompanyName) return metadataCompanyName;
  const displayName = getDisplayName(authUser);
  return displayName ? `${displayName}'s Company` : "My Company";
}

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

  if (data?.company_id) {
    return {
      id: data.id,
      companyId: data.company_id,
    };
  }

  if (!authUser.email) {
    return null;
  }

  const companyName = getCompanyName(authUser);
  const slug = `${slugifyCompanyName(companyName)}-${authUser.id.slice(0, 6)}`;

  const { error: companyError } = await supabase
    .from("companies")
    .upsert(
      {
        id: authUser.id,
        name: companyName,
        slug,
      },
      { onConflict: "id" }
    );

  if (companyError) {
    throw new Error(companyError.message);
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        id: authUser.id,
        company_id: authUser.id,
        email: authUser.email,
        name: getDisplayName(authUser),
        email_verified: !!authUser.email_confirmed_at,
      },
      { onConflict: "id" }
    )
    .select("id, company_id")
    .single();

  if (userError) {
    throw new Error(userError.message);
  }

  return {
    id: (userData as AppUser).id,
    companyId: (userData as AppUser).company_id,
  };
}

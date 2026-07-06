import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = sanitizeRedirect(searchParams.get("redirectTo")) ?? "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const hasDashboardAccess = user ? await userHasDashboardAccess(supabase, user.id) : false;
      const target = redirectTo.startsWith("/dashboard") && !hasDashboardAccess ? "/account" : redirectTo;
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

function sanitizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

async function userHasDashboardAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("id", userId)
    .maybeSingle();

  return Boolean(data?.company_id);
}

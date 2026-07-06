import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth checks if Supabase is not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !supabaseUrl.startsWith("http")
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasDashboardAccess = false;
  if (user) {
    const { data: appUser } = await supabase
      .from("users")
      .select("id, company_id")
      .eq("id", user.id)
      .maybeSingle();
    hasDashboardAccess = Boolean(appUser?.company_id);
  }

  // Protect dashboard routes for internal/admin users only. Buyer/visitor
  // accounts can share Supabase auth, but they must not auto-enter admin tools.
  if (request.nextUrl.pathname.startsWith("/dashboard") && (!user || !hasDashboardAccess)) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/account" : "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from admin login according to their realm.
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = hasDashboardAccess ? "/dashboard" : "/account";
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/contact";
    url.searchParams.set("source", "admin-access");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

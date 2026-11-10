import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string().min(1).max(16384) }).parse(await request.json());
    const { data, error } = await createSupabaseAdminClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    return NextResponse.json({ token: data.session.access_token, refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at, userId: data.user.id, email: data.user.email ?? "",
      name: data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to refresh your session." }, { status: 400 });
  }
}

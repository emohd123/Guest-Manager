export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "../../utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    });

    if (authError || !authData.session) {
      return jsonError("Invalid email or password", 401, "invalid_credentials");
    }

    const name =
      (authData.user.user_metadata?.name as string | undefined) ??
      parsed.email.split("@")[0];

    return NextResponse.json({
      token: authData.session.access_token,
      userId: authData.user.id,
      email: parsed.email,
      name,
      guestId: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid request body", 400, "validation_failed");
    }
    return jsonError(
      error instanceof Error ? error.message : "Login failed",
      500,
      "login_failed"
    );
  }
}

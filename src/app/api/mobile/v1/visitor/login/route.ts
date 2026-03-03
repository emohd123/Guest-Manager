export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "../../utils";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { guests } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.parse(await request.json());

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Sign in with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    });

    if (authError || !authData.session) {
      return jsonError("Invalid email or password", 401, "invalid_credentials");
    }

    const userId = authData.user.id;
    const token = authData.session.access_token;

    // Get display name from user metadata
    const name = (authData.user.user_metadata?.name as string | undefined) ?? parsed.email.split("@")[0];

    // Try to find a guest record linked to this email
    const db = getDb();
    const guestRow = await db.query.guests
      .findFirst({ where: eq(guests.email, parsed.email) })
      .catch(() => null);

    return NextResponse.json({
      token,
      userId,
      email: parsed.email,
      name,
      guestId: guestRow?.id ?? null,
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

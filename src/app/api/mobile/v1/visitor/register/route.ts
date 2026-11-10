export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "../../utils";
import { createClient } from "@supabase/supabase-js";

const bodySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().default(""),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.parse(await request.json());

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Use the public verification flow. Never auto-confirm a customer email:
    // ticket ownership is derived from that verified email address.
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: { data: {
        name: `${parsed.firstName} ${parsed.lastName}`.trim(),
        firstName: parsed.firstName,
        lastName: parsed.lastName,
      } },
    });

    if (signUpError) {
      console.error("[visitor/register] Supabase createUser error:", signUpError);
      // Supabase returns this for duplicate emails
      if (
        signUpError.message?.toLowerCase().includes("already") ||
        signUpError.message?.toLowerCase().includes("registered") ||
        signUpError.status === 422
      ) {
        return jsonError("An account with this email already exists. Please sign in.", 409, "email_taken");
      }
      return jsonError(signUpError.message ?? "Failed to create account", 400, "signup_failed");
    }

    if (!authData.user) {
      return jsonError("Failed to create account", 400, "signup_failed");
    }

    const userId = authData.user.id;
    const fullName = `${parsed.firstName} ${parsed.lastName}`.trim();

    if (!authData.session || !authData.user.email_confirmed_at) return NextResponse.json({ requiresEmailVerification: true }, { headers: { "Cache-Control": "no-store" } });
    const sessionData = { session: authData.session };

    const token = sessionData.session.access_token;

    // Note: We don't create a guest record here — guests.eventId and guests.companyId are required
    // and a self-registered visitor doesn't belong to a specific event yet.
    // When the iTicket team links the attendee's email to an event, they'll have a guest+ticket record.
    // that the visitor can find by entering the event code.

    return NextResponse.json({
      token,
      refreshToken: sessionData.session.refresh_token,
      expiresAt: sessionData.session.expires_at,
      userId,
      email: parsed.email,
      name: fullName,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return jsonError(firstIssue?.message ?? "Invalid request", 400, "validation_failed");
    }
    console.error("[visitor/register] Unexpected error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Registration failed",
      500,
      "register_failed"
    );
  }
}

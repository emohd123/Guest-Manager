import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EXPO_TOKEN_PATTERN } from "@/lib/push-notifications";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { privateEventAccessCookie } from "@/server/services/private-event-access";
import { readVerifiedPrivateEventAccess } from "@/server/services/verified-private-event-access";
import {
  clearNotificationIdentity,
  hashDeviceSecret,
  notificationDeviceCookie,
  signDeviceCookie,
} from "@/server/services/notification-devices";

export const dynamic = "force-dynamic";
const schema = z
  .object({
    id: z.string().uuid(),
    secret: z.string().regex(/^[a-f0-9]{64}$/),
    token: z.string().max(200).regex(EXPO_TOKEN_PATTERN),
    platform: z.enum(["android", "ios"]),
    newEvents: z.boolean().default(false),
  })
  .strict();
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
const headers = { "cache-control": "no-store" };

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid origin." },
      { status: 403, headers },
    );
  try {
    const input = schema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    const secretHash = hashDeviceSecret(input.secret);
    const { data: existing, error: lookupError } = await admin
      .from("notification_devices")
      .select("id,secret_hash")
      .eq("id", input.id)
      .maybeSingle();
    if (lookupError) throw new Error();
    if (existing && existing.secret_hash !== secretHash)
      return NextResponse.json(
        { error: "This phone could not be verified." },
        { status: 403, headers },
      );
    const auth = await createClient();
    const native = request.headers.get("x-iticket-native") === "1";
    const accountToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    const {
      data: { user },
      error: authError,
    } = accountToken ? await auth.auth.getUser(accountToken) : native ? { data: { user: null }, error: null } : await auth.auth.getUser();
    if (accountToken && !user) return NextResponse.json({ error: "Sign in again to connect notifications." }, { status: 401, headers });
    // A transient auth failure must not attach a device to a guessed identity.
    if (
      authError &&
      authError.status !== 400 &&
      authError.status !== 401 &&
      authError.name !== "AuthSessionMissingError"
    )
      throw new Error();
    const access = await readVerifiedPrivateEventAccess(
      request.headers.get("x-conference-access") ?? (native ? undefined : request.cookies.get(privateEventAccessCookie.name)?.value),
    );
    if (request.headers.has("x-conference-access") && !access) return NextResponse.json({ error: "Conference access has expired." }, { status: 401, headers });
    const row = {
      id: input.id,
      secret_hash: secretHash,
      token: input.token,
      platform: input.platform,
      user_id: user?.id ?? null,
      recipient_email: user?.email?.toLowerCase() ?? null,
      conference_event_id: access?.eventId ?? null,
      conference_role: access?.role ?? (access ? "attendee" : null),
      conference_expires_at: access
        ? new Date(access.expiresAt).toISOString()
        : null,
      event_updates: true,
      new_events: input.newEvents,
      enabled: true,
      updated_at: new Date().toISOString(),
    };
    // The compare-and-update predicate prevents concurrent ownership replacement.
    const saved = existing
      ? await admin
          .from("notification_devices")
          .update(row)
          .eq("id", input.id)
          .eq("secret_hash", secretHash)
          .select("id")
          .single()
      : await admin
          .from("notification_devices")
          .insert(row)
          .select("id")
          .single();
    if (saved.error) throw new Error();
    const response = NextResponse.json(
      {
        success: true,
        accountConnected: !!user,
        conferenceConnected: !!access,
      },
      { headers },
    );
    response.cookies.set(notificationDeviceCookie, signDeviceCookie(input.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 90 * 86400,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? "Invalid notification registration."
            : "Notifications could not be connected. Please retry.",
      },
      { status: error instanceof z.ZodError ? 400 : 503, headers },
    );
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid origin." },
      { status: 403, headers },
    );
  try {
    const scope = request.nextUrl.searchParams.get("scope");
    const proof = z
      .object({
        id: z.string().uuid(),
        secret: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict()
      .safeParse(await request.json().catch(() => null));
    await clearNotificationIdentity(
      request,
      scope === "account" || scope === "conference" ? scope : "all",
      proof.success ? proof.data : undefined,
    );
    return NextResponse.json({ success: true }, { headers });
  } catch {
    return NextResponse.json(
      { error: "Could not disconnect notifications. Please retry." },
      { status: 503, headers },
    );
  }
}

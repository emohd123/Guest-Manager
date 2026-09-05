import crypto from "node:crypto";
import process from "node:process";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });

const baseUrl = (process.env.RELEASE_BASE_URL || "https://www.iticket.info").replace(/\/$/, "");
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = crypto.randomUUID().slice(0, 8);
const email = `release-scanner-${runId}@eventshub.test`;
const password = `Release-${crypto.randomUUID()}!`;
const barcode = `E2E-${runId}-${Date.now()}`;
let authUserId = null;
let ticketId = null;

function assert(condition, message, detail) {
  if (!condition) {
    throw new Error(`${message}${detail ? `: ${JSON.stringify(detail)}` : ""}`);
  }
}

async function scan(eventId, accessToken, action = "check_in", scannedBarcode = barcode) {
  const response = await fetch(`${baseUrl}/api/checkin/events/${eventId}/scan`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      barcode: scannedBarcode,
      action,
      deviceName: `Release smoke ${runId}`,
      clientMutationId: crypto.randomUUID(),
    }),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
}

async function cleanup() {
  if (ticketId) {
    await admin.from("check_ins").delete().eq("ticket_id", ticketId);
    await admin.from("scans").delete().eq("ticket_id", ticketId);
    await admin.from("tickets").delete().eq("id", ticketId);
  }
  if (authUserId) {
    await admin.from("users").delete().eq("id", authUserId);
    await admin.auth.admin.deleteUser(authUserId);
  }
}

try {
  const home = await fetch(baseUrl, { redirect: "follow" });
  assert(home.ok, "Production home page did not respond", { status: home.status });

  const { data: eventRows, error: eventError } = await admin
    .from("events")
    .select("id,company_id,title,starts_at,ends_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);
  assert(!eventError && eventRows?.length, "No future published event is available", eventError);

  let event = null;
  let ticketType = null;
  for (const candidate of eventRows) {
    const { data } = await admin
      .from("ticket_types")
      .select("id,name,price,currency")
      .eq("event_id", candidate.id)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) {
      event = candidate;
      ticketType = data;
      break;
    }
  }
  assert(event && ticketType, "No future event with an active ticket type is available");

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Release Scanner" },
  });
  assert(!createUserError && createdUser.user, "Could not create temporary scanner user", createUserError);
  authUserId = createdUser.user.id;

  const { error: appUserError } = await admin.from("users").upsert({
    id: authUserId,
    company_id: event.company_id,
    email,
    name: "Release Scanner",
    role: "staff",
    email_verified: true,
    dashboard_access: "limited",
    dashboard_permissions: ["events.read", "events.operate"],
  });
  assert(!appUserError, "Could not create temporary app user", appUserError);

  const { data: session, error: signInError } = await admin.auth.signInWithPassword({ email, password });
  assert(!signInError && session.session?.access_token, "Could not authenticate temporary scanner user", signInError);
  const accessToken = session.session.access_token;

  ticketId = crypto.randomUUID();
  const { error: ticketError } = await admin.from("tickets").insert({
    id: ticketId,
    company_id: event.company_id,
    event_id: event.id,
    ticket_type_id: ticketType.id,
    barcode,
    status: "valid",
    attendee_name: "Release Scanner Ticket",
    attendee_email: email,
    checked_in: false,
    metadata: { releaseSmoke: runId },
  });
  assert(!ticketError, "Could not create temporary ticket", ticketError);

  const first = await scan(event.id, accessToken);
  assert(first.status === 200 && first.body.status === "success" && first.body.result === "success", "First check-in failed", first);

  const duplicate = await scan(event.id, accessToken);
  assert(duplicate.status === 200 && duplicate.body.status === "revalidated" && duplicate.body.result === "revalidated", "Duplicate scan was not safely rejected", duplicate);

  const otherEvent = eventRows.find((candidate) => candidate.id !== event.id && candidate.company_id === event.company_id);
  if (otherEvent) {
    const wrongEvent = await scan(otherEvent.id, accessToken);
    assert(wrongEvent.status === 200 && wrongEvent.body.result === "wrong_event", "Wrong-event ticket was not rejected", wrongEvent);
  }

  const checkout = await scan(event.id, accessToken, "checkout");
  assert(checkout.status === 200 && checkout.body.status === "success" && checkout.body.result === "checked_out", "Checkout failed", checkout);

  const { data: ticketAfter, error: ticketAfterError } = await admin
    .from("tickets")
    .select("checked_in,status")
    .eq("id", ticketId)
    .single();
  assert(!ticketAfterError && ticketAfter.checked_in === false, "Checkout was not persisted", ticketAfterError || ticketAfter);

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    event: event.title,
    checks: ["home", "check-in", "duplicate", otherEvent ? "wrong-event" : null, "checkout", "persistence"].filter(Boolean),
  }, null, 2));
} finally {
  await cleanup();
}

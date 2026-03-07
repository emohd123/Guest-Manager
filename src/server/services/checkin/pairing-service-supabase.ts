import crypto from "crypto";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { generateAccessCode, generatePin, hashPin, signDeviceToken, verifyPin } from "./crypto";
import { isRateLimited, registerAttempt } from "./rate-limit";

type DeviceRegistrationInput = {
  eventId: string;
  companyId: string;
  name?: string;
  installationId?: string;
  platform?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  pairedVia: "code_pin" | "qr" | "staff";
};

const lastIssuedPinByEvent = new Map<string, string>();

function buildDeviceName(input: DeviceRegistrationInput) {
  if (input.name?.trim()) return input.name.trim();
  const platform = input.platform?.toUpperCase() ?? "MOBILE";
  const model = input.model?.trim() ?? "Device";
  return `${platform} ${model}`.slice(0, 120);
}

async function getEventCompany(eventId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, company_id")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id as string,
    companyId: data.company_id as string,
  };
}

async function createOrUpdateDevice(input: DeviceRegistrationInput) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const onsitePin = generatePin();

  if (input.installationId) {
    const { data: existing, error: existingError } = await supabase
      .from("devices")
      .select("id")
      .eq("event_id", input.eventId)
      .eq("installation_id", input.installationId)
      .is("archived_at", null)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing) {
      const updatePayload = {
        name: buildDeviceName(input),
        platform: input.platform ?? null,
        model: input.model ?? null,
        os_version: input.osVersion ?? null,
        app_version: input.appVersion ?? null,
        paired_via: input.pairedVia,
        status: "online",
        last_report_at: now,
        last_sync_at: now,
        onsite_pin: onsitePin,
        archived_at: null,
        updated_at: now,
      };

      const { data: updated, error: updateError } = await supabase
        .from("devices")
        .update(updatePayload)
        .eq("id", existing.id)
        .select("id, event_id, company_id, name")
        .single();

      if (updateError) throw new Error(updateError.message);
      return {
        id: updated.id as string,
        eventId: updated.event_id as string,
        companyId: updated.company_id as string,
        name: updated.name as string,
      };
    }
  }

  const createPayload = {
    id: `dev_${crypto.randomUUID().replace(/-/g, "")}`,
    company_id: input.companyId,
    event_id: input.eventId,
    name: buildDeviceName(input),
    installation_id: input.installationId ?? null,
    platform: input.platform ?? null,
    model: input.model ?? null,
    os_version: input.osVersion ?? null,
    app_version: input.appVersion ?? null,
    paired_via: input.pairedVia,
    status: "online",
    last_report_at: now,
    last_sync_at: now,
    onsite_pin: onsitePin,
  };

  const { data: created, error: createError } = await supabase
    .from("devices")
    .insert(createPayload)
    .select("id, event_id, company_id, name")
    .single();

  if (createError) throw new Error(createError.message);

  return {
    id: created.id as string,
    eventId: created.event_id as string,
    companyId: created.company_id as string,
    name: created.name as string,
  };
}

export async function getPairingAccessSupabase(eventId: string, createdBy?: string | null) {
  const supabase = createSupabaseAdminClient();
  const event = await getEventCompany(eventId);
  if (!event) throw new Error("Event not found");

  const { data: existing, error: existingError } = await supabase
    .from("event_device_access")
    .select("event_id, access_code, pin_hash, is_enabled, last_rotated_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing) {
    return {
      eventId,
      accessCode: existing.access_code as string,
      pin: lastIssuedPinByEvent.get(eventId) ?? (existing.pin_hash ? "HIDDEN" : null),
      isEnabled: Boolean(existing.is_enabled),
      lastRotatedAt: existing.last_rotated_at as string | null,
    };
  }

  const accessCode = generateAccessCode();
  const pin = generatePin();

  const { data: created, error: createError } = await supabase
    .from("event_device_access")
    .insert({
      event_id: eventId,
      access_code: accessCode,
      pin_hash: hashPin(pin),
      is_enabled: true,
      last_rotated_at: new Date().toISOString(),
      created_by: createdBy ?? null,
    })
    .select("event_id, access_code, is_enabled, last_rotated_at")
    .single();

  if (createError) throw new Error(createError.message);

  lastIssuedPinByEvent.set(eventId, pin);

  return {
    eventId,
    accessCode: created.access_code as string,
    pin,
    isEnabled: Boolean(created.is_enabled),
    lastRotatedAt: created.last_rotated_at as string | null,
  };
}

export async function rotatePairingAccessSupabase(eventId: string, rotatedBy?: string | null) {
  const supabase = createSupabaseAdminClient();
  const nextCode = generateAccessCode();
  const nextPin = generatePin();
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("event_device_access")
    .update({
      access_code: nextCode,
      pin_hash: hashPin(nextPin),
      is_enabled: true,
      last_rotated_at: now,
      created_by: rotatedBy ?? null,
      updated_at: now,
    })
    .eq("event_id", eventId)
    .select("event_id, access_code, is_enabled, last_rotated_at")
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  if (!updated) {
    await getPairingAccessSupabase(eventId, rotatedBy);
    return rotatePairingAccessSupabase(eventId, rotatedBy);
  }

  lastIssuedPinByEvent.set(eventId, nextPin);

  return {
    eventId,
    accessCode: updated.access_code as string,
    pin: nextPin,
    isEnabled: Boolean(updated.is_enabled),
    lastRotatedAt: updated.last_rotated_at as string | null,
  };
}

type PairInput = {
  code: string;
  pin: string;
  rateLimitKey: string;
  device: Omit<DeviceRegistrationInput, "eventId" | "companyId" | "pairedVia"> & {
    name?: string;
  };
};

export async function pairWithCodePinSupabase(input: PairInput) {
  if (isRateLimited(input.rateLimitKey)) {
    throw new Error("Too many attempts. Please try again shortly.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: accessRow, error: accessError } = await supabase
    .from("event_device_access")
    .select("event_id, access_code, pin_hash, is_enabled")
    .eq("access_code", input.code.toUpperCase())
    .maybeSingle();

  if (accessError) throw new Error(accessError.message);
  if (!accessRow) {
    registerAttempt(input.rateLimitKey, false);
    throw new Error("Invalid access code or PIN");
  }

  const event = await getEventCompany(accessRow.event_id as string);
  if (!event || !accessRow.is_enabled || !verifyPin(input.pin, accessRow.pin_hash as string)) {
    registerAttempt(input.rateLimitKey, false);
    throw new Error("Invalid access code or PIN");
  }

  registerAttempt(input.rateLimitKey, true);

  const device = await createOrUpdateDevice({
    eventId: accessRow.event_id as string,
    companyId: event.companyId,
    name: input.device.name,
    installationId: input.device.installationId,
    platform: input.device.platform,
    model: input.device.model,
    osVersion: input.device.osVersion,
    appVersion: input.device.appVersion,
    pairedVia: "code_pin",
  });

  const token = signDeviceToken({
    sub: device.id,
    eventId: device.eventId,
    companyId: device.companyId,
    type: "device",
  });

  return { token, device };
}

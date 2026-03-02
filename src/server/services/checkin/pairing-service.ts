import { and, eq, gt, isNull } from "drizzle-orm";
import crypto from "crypto";
import { getDb } from "@/server/db";
import { devicePairTokens, devices, eventDeviceAccess, events } from "@/server/db/schema";
import { checkinV2Config } from "./config";
import {
  generateAccessCode,
  generatePin,
  hashPin,
  hashToken,
  signDeviceToken,
  verifyPin,
} from "./crypto";
import { isRateLimited, registerAttempt } from "./rate-limit";

type Db = ReturnType<typeof getDb>;

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

async function createOrUpdateDevice(db: Db, input: DeviceRegistrationInput) {
  const now = new Date();
  const onsitePin = generatePin();

  if (input.installationId) {
    const [existing] = await db
      .select()
      .from(devices)
      .where(
        and(eq(devices.eventId, input.eventId), eq(devices.installationId, input.installationId))
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(devices)
        .set({
          name: buildDeviceName(input),
          platform: input.platform,
          model: input.model,
          osVersion: input.osVersion,
          appVersion: input.appVersion,
          pairedVia: input.pairedVia,
          status: "online",
          lastReportAt: now,
          lastSyncAt: now,
          onsitePin,
          archivedAt: null,
          updatedAt: now,
        })
        .where(eq(devices.id, existing.id))
        .returning();
      return updated;
    }
  }

  const [created] = await db
    .insert(devices)
    .values({
      companyId: input.companyId,
      eventId: input.eventId,
      name: buildDeviceName(input),
      installationId: input.installationId,
      platform: input.platform,
      model: input.model,
      osVersion: input.osVersion,
      appVersion: input.appVersion,
      pairedVia: input.pairedVia,
      status: "online",
      lastReportAt: now,
      lastSyncAt: now,
      onsitePin,
    })
    .returning();

  return created;
}

async function getEventCompany(db: Db, eventId: string) {
  const [event] = await db
    .select({ id: events.id, companyId: events.companyId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  return event ?? null;
}

export async function getPairingAccess(db: Db, eventId: string, createdBy?: string | null) {
  const event = await getEventCompany(db, eventId);
  if (!event) throw new Error("Event not found");

  const [existing] = await db
    .select()
    .from(eventDeviceAccess)
    .where(eq(eventDeviceAccess.eventId, eventId))
    .limit(1);

  if (existing) {
    return {
      eventId,
      accessCode: existing.accessCode,
      pin: lastIssuedPinByEvent.get(eventId) ?? null,
      isEnabled: existing.isEnabled,
      lastRotatedAt: existing.lastRotatedAt,
    };
  }

  const accessCode = generateAccessCode();
  const pin = generatePin();
  const [created] = await db
    .insert(eventDeviceAccess)
    .values({
      eventId,
      accessCode,
      pinHash: hashPin(pin),
      isEnabled: true,
      lastRotatedAt: new Date(),
      createdBy: createdBy ?? null,
    })
    .returning();

  lastIssuedPinByEvent.set(eventId, pin);

  return {
    eventId,
    accessCode: created.accessCode,
    pin,
    isEnabled: created.isEnabled,
    lastRotatedAt: created.lastRotatedAt,
  };
}

export async function rotatePairingAccess(db: Db, eventId: string, rotatedBy?: string | null) {
  const nextCode = generateAccessCode();
  const nextPin = generatePin();
  const now = new Date();

  const [updated] = await db
    .update(eventDeviceAccess)
    .set({
      accessCode: nextCode,
      pinHash: hashPin(nextPin),
      isEnabled: true,
      lastRotatedAt: now,
      createdBy: rotatedBy ?? null,
      updatedAt: now,
    })
    .where(eq(eventDeviceAccess.eventId, eventId))
    .returning();

  if (!updated) {
    await getPairingAccess(db, eventId, rotatedBy);
    return rotatePairingAccess(db, eventId, rotatedBy);
  }

  lastIssuedPinByEvent.set(eventId, nextPin);

  return {
    eventId,
    accessCode: updated.accessCode,
    pin: nextPin,
    isEnabled: updated.isEnabled,
    lastRotatedAt: updated.lastRotatedAt,
  };
}

export async function createPairingQrToken(db: Db, eventId: string, createdBy?: string | null) {
  const event = await getEventCompany(db, eventId);
  if (!event) throw new Error("Event not found");

  const rawToken = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + checkinV2Config.pairQrTtlSeconds * 1000);

  const [created] = await db
    .insert(devicePairTokens)
    .values({
      eventId,
      companyId: event.companyId,
      tokenHash: hashToken(rawToken),
      expiresAt,
      createdBy: createdBy ?? null,
    })
    .returning({ id: devicePairTokens.id, expiresAt: devicePairTokens.expiresAt });

  return {
    id: created.id,
    token: rawToken,
    expiresAt: created.expiresAt,
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

export async function pairWithCodePin(db: Db, input: PairInput) {
  if (isRateLimited(input.rateLimitKey)) {
    throw new Error("Too many attempts. Please try again shortly.");
  }

  const [accessRow] = await db
    .select({
      eventId: eventDeviceAccess.eventId,
      accessCode: eventDeviceAccess.accessCode,
      pinHash: eventDeviceAccess.pinHash,
      isEnabled: eventDeviceAccess.isEnabled,
      companyId: events.companyId,
    })
    .from(eventDeviceAccess)
    .innerJoin(events, eq(events.id, eventDeviceAccess.eventId))
    .where(eq(eventDeviceAccess.accessCode, input.code.toUpperCase()))
    .limit(1);

  if (!accessRow || !accessRow.isEnabled || !verifyPin(input.pin, accessRow.pinHash)) {
    registerAttempt(input.rateLimitKey, false);
    throw new Error("Invalid access code or PIN");
  }

  registerAttempt(input.rateLimitKey, true);

  const device = await createOrUpdateDevice(db, {
    eventId: accessRow.eventId,
    companyId: accessRow.companyId,
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

type PairWithTokenInput = {
  qrToken: string;
  device: Omit<DeviceRegistrationInput, "eventId" | "companyId" | "pairedVia">;
};

export async function pairWithQrToken(db: Db, input: PairWithTokenInput) {
  const now = new Date();
  const [tokenRow] = await db
    .select()
    .from(devicePairTokens)
    .where(
      and(
        eq(devicePairTokens.tokenHash, hashToken(input.qrToken)),
        isNull(devicePairTokens.usedAt),
        gt(devicePairTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!tokenRow) throw new Error("QR token is invalid or expired");

  const [updatedToken] = await db
    .update(devicePairTokens)
    .set({ usedAt: now })
    .where(eq(devicePairTokens.id, tokenRow.id))
    .returning();

  if (!updatedToken) throw new Error("Unable to consume QR token");

  const device = await createOrUpdateDevice(db, {
    eventId: tokenRow.eventId,
    companyId: tokenRow.companyId,
    name: input.device.name,
    installationId: input.device.installationId,
    platform: input.device.platform,
    model: input.device.model,
    osVersion: input.device.osVersion,
    appVersion: input.device.appVersion,
    pairedVia: "qr",
  });

  const token = signDeviceToken({
    sub: device.id,
    eventId: device.eventId,
    companyId: device.companyId,
    type: "device",
  });

  return { token, device };
}

type PairWithStaffInput = {
  eventId: string;
  staffCompanyId: string;
  device: Omit<DeviceRegistrationInput, "eventId" | "companyId" | "pairedVia">;
};

export async function pairWithStaff(db: Db, input: PairWithStaffInput) {
  const event = await getEventCompany(db, input.eventId);
  if (!event || event.companyId !== input.staffCompanyId) {
    throw new Error("You are not authorized to pair with this event");
  }

  const device = await createOrUpdateDevice(db, {
    eventId: input.eventId,
    companyId: input.staffCompanyId,
    name: input.device.name,
    installationId: input.device.installationId,
    platform: input.device.platform,
    model: input.device.model,
    osVersion: input.device.osVersion,
    appVersion: input.device.appVersion,
    pairedVia: "staff",
  });

  const token = signDeviceToken({
    sub: device.id,
    eventId: device.eventId,
    companyId: device.companyId,
    type: "device",
  });

  return { token, device };
}

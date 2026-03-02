import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  deviceCommands,
  devices,
  guests,
  scans,
} from "@/server/db/schema";
import { checkinV2Config } from "./config";
import type { DeviceTokenClaims } from "./crypto";

type Db = ReturnType<typeof getDb>;

export async function markExpiredCommands(db: Db) {
  const now = new Date();
  await db
    .update(deviceCommands)
    .set({ status: "expired" })
    .where(and(eq(deviceCommands.status, "pending"), lt(deviceCommands.expiresAt, now)));
}

function getOnlineCutoff() {
  return new Date(Date.now() - checkinV2Config.onlineThresholdSeconds * 1000);
}

export async function listEventDevices(db: Db, eventId: string, companyId: string) {
  const rows = await db
    .select()
    .from(devices)
    .where(
      and(
        eq(devices.eventId, eventId),
        eq(devices.companyId, companyId),
        isNull(devices.archivedAt)
      )
    )
    .orderBy(desc(devices.createdAt));

  const cutoff = getOnlineCutoff();
  return rows.map((row) => ({
    ...row,
    computedOnline: !!row.lastReportAt && row.lastReportAt > cutoff,
  }));
}

export async function getDeviceStats(db: Db, eventId: string, companyId: string) {
  const cutoff = getOnlineCutoff();

  const [deviceCounts] = await db
    .select({
      total: sql<number>`count(*)`,
      online: sql<number>`count(*) filter (where ${devices.lastReportAt} is not null and ${devices.lastReportAt} > ${cutoff})`,
      lowBattery: sql<number>`count(*) filter (where coalesce(${devices.battery}, 100) <= 20 or coalesce(${devices.scannerBattery}, 100) <= 20)`,
    })
    .from(devices)
    .where(
      and(
        eq(devices.eventId, eventId),
        eq(devices.companyId, companyId),
        isNull(devices.archivedAt)
      )
    );

  const [scanCounts] = await db
    .select({
      successfulScans: sql<number>`count(*) filter (where ${scans.scanType} <> 'invalid')`,
      unsuccessfulScans: sql<number>`count(*) filter (where ${scans.scanType} = 'invalid')`,
    })
    .from(scans)
    .where(and(eq(scans.eventId, eventId), eq(scans.companyId, companyId)));

  const [attendanceCounts] = await db
    .select({
      noShow: sql<number>`count(*) filter (where ${guests.status} = 'no_show')`,
      checkedIn: sql<number>`count(*) filter (where ${guests.attendanceState} = 'checked_in')`,
      checkedOut: sql<number>`count(*) filter (where ${guests.attendanceState} = 'checked_out')`,
    })
    .from(guests)
    .where(and(eq(guests.eventId, eventId), eq(guests.companyId, companyId)));

  const total = Number(deviceCounts?.total ?? 0);
  const online = Number(deviceCounts?.online ?? 0);

  return {
    devicesOnline: online,
    devicesOffline: Math.max(total - online, 0),
    lowBattery: Number(deviceCounts?.lowBattery ?? 0),
    successfulScans: Number(scanCounts?.successfulScans ?? 0),
    unsuccessfulScans: Number(scanCounts?.unsuccessfulScans ?? 0),
    noShow: Number(attendanceCounts?.noShow ?? 0),
    checkedOut: Number(attendanceCounts?.checkedOut ?? 0),
    checkedIn: Number(attendanceCounts?.checkedIn ?? 0),
  };
}

type HeartbeatInput = {
  battery?: number;
  scannerBattery?: number;
  scannerChargeState?: string;
  appVersion?: string;
  station?: string;
  lastSyncAt?: string;
};

export async function heartbeatDevice(
  db: Db,
  claims: DeviceTokenClaims,
  payload: HeartbeatInput
) {
  const now = new Date();
  const [updated] = await db
    .update(devices)
    .set({
      status: "online",
      battery: payload.battery ?? undefined,
      scannerBattery: payload.scannerBattery ?? undefined,
      scannerChargeState: payload.scannerChargeState ?? undefined,
      appVersion: payload.appVersion ?? undefined,
      station: payload.station ?? undefined,
      lastReportAt: now,
      lastSyncAt: payload.lastSyncAt ? new Date(payload.lastSyncAt) : now,
      updatedAt: now,
    })
    .where(
      and(
        eq(devices.id, claims.sub),
        eq(devices.eventId, claims.eventId),
        eq(devices.companyId, claims.companyId)
      )
    )
    .returning({
      id: devices.id,
      lastReportAt: devices.lastReportAt,
      lastSyncAt: devices.lastSyncAt,
      status: devices.status,
    });

  if (!updated) {
    throw new Error("Device not found");
  }

  return updated;
}

export async function pollDeviceCommands(db: Db, claims: DeviceTokenClaims) {
  await markExpiredCommands(db);

  return db
    .select({
      id: deviceCommands.id,
      commandType: deviceCommands.commandType,
      payload: deviceCommands.payload,
      createdAt: deviceCommands.createdAt,
      expiresAt: deviceCommands.expiresAt,
    })
    .from(deviceCommands)
    .where(
      and(
        eq(deviceCommands.deviceId, claims.sub),
        eq(deviceCommands.eventId, claims.eventId),
        eq(deviceCommands.companyId, claims.companyId),
        eq(deviceCommands.status, "pending"),
        gt(deviceCommands.expiresAt, new Date())
      )
    )
    .orderBy(desc(deviceCommands.createdAt));
}

export async function ackDeviceCommand(db: Db, claims: DeviceTokenClaims, commandId: string) {
  const [updated] = await db
    .update(deviceCommands)
    .set({ status: "ack", ackAt: new Date() })
    .where(
      and(
        eq(deviceCommands.id, commandId),
        eq(deviceCommands.deviceId, claims.sub),
        eq(deviceCommands.eventId, claims.eventId),
        eq(deviceCommands.companyId, claims.companyId)
      )
    )
    .returning({ id: deviceCommands.id, status: deviceCommands.status });

  if (!updated) throw new Error("Command not found");
  return updated;
}

export async function createPingCommand(db: Db, input: { eventId: string; companyId: string; deviceId: string }) {
  const [command] = await db
    .insert(deviceCommands)
    .values({
      eventId: input.eventId,
      companyId: input.companyId,
      deviceId: input.deviceId,
      commandType: "ping",
      payload: {},
      status: "pending",
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    })
    .returning();

  return command;
}

export async function updateDeviceRecord(
  db: Db,
  input: {
    eventId: string;
    companyId: string;
    deviceId: string;
    name?: string;
    station?: string;
    status?: "online" | "offline";
    battery?: number;
    scannerBattery?: number;
    scannerChargeState?: string;
    appVersion?: string;
  }
) {
  const [updated] = await db
    .update(devices)
    .set({
      name: input.name,
      station: input.station,
      status: input.status,
      battery: input.battery,
      scannerBattery: input.scannerBattery,
      scannerChargeState: input.scannerChargeState,
      appVersion: input.appVersion,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(devices.id, input.deviceId),
        eq(devices.eventId, input.eventId),
        eq(devices.companyId, input.companyId)
      )
    )
    .returning();

  if (!updated) throw new Error("Device not found");
  return updated;
}

export async function archiveDevice(
  db: Db,
  input: { eventId: string; companyId: string; deviceId: string }
) {
  const [updated] = await db
    .update(devices)
    .set({ archivedAt: new Date(), status: "offline", updatedAt: new Date() })
    .where(
      and(
        eq(devices.id, input.deviceId),
        eq(devices.eventId, input.eventId),
        eq(devices.companyId, input.companyId)
      )
    )
    .returning({ id: devices.id });

  if (!updated) throw new Error("Device not found");
  return updated;
}

export async function deleteDevice(
  db: Db,
  input: { eventId: string; companyId: string; deviceId: string }
) {
  const [deleted] = await db
    .delete(devices)
    .where(
      and(
        eq(devices.id, input.deviceId),
        eq(devices.eventId, input.eventId),
        eq(devices.companyId, input.companyId)
      )
    )
    .returning({ id: devices.id });

  if (!deleted) throw new Error("Device not found");
  return deleted;
}

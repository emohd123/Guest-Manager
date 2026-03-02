import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "@/server/db";
import { devices, users } from "@/server/db/schema";
import { verifyDeviceToken, type DeviceTokenClaims } from "./crypto";

type Db = ReturnType<typeof getDb>;

export type StaffAuth = {
  kind: "staff";
  userId: string;
  companyId: string;
};

export type DeviceAuth = {
  kind: "device";
  claims: DeviceTokenClaims;
};

export type MobileAuth = StaffAuth | DeviceAuth;

export function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export async function validateDeviceToken(db: Db, token: string) {
  const claims = verifyDeviceToken(token);
  if (!claims) return null;

  const [device] = await db
    .select({ id: devices.id })
    .from(devices)
    .where(
      and(
        eq(devices.id, claims.sub),
        eq(devices.eventId, claims.eventId),
        eq(devices.companyId, claims.companyId),
        isNull(devices.archivedAt)
      )
    )
    .limit(1);

  return device ? claims : null;
}

export async function validateStaffToken(db: Db, token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const [appUser] = await db
    .select({ id: users.id, companyId: users.companyId })
    .from(users)
    .where(eq(users.id, data.user.id))
    .limit(1);

  if (!appUser?.companyId) return null;
  return {
    userId: appUser.id,
    companyId: appUser.companyId,
  };
}

export async function authenticateMobileRequest(db: Db, request: NextRequest): Promise<MobileAuth> {
  const token = getBearerToken(request);
  if (!token) throw new Error("Missing bearer token");

  const deviceClaims = await validateDeviceToken(db, token);
  if (deviceClaims) {
    return { kind: "device", claims: deviceClaims };
  }

  const staff = await validateStaffToken(db, token);
  if (staff) {
    return { kind: "staff", ...staff };
  }

  throw new Error("Invalid authentication token");
}


import crypto from "crypto";
import { checkinV2Config } from "./config";

export type DeviceTokenClaims = {
  sub: string;
  eventId: string;
  companyId: string;
  type: "device";
  iat: number;
  exp: number;
};

function base64UrlEncode(value: Buffer | string) {
  const raw = Buffer.isBuffer(value) ? value.toString("base64") : Buffer.from(value).toString("base64");
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generatePin() {
  const value = Math.floor(Math.random() * 10000);
  return value.toString().padStart(4, "0");
}

export function hashPin(pin: string) {
  const salt = crypto.randomBytes(8).toString("hex");
  const digest = crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
  return `v1$${salt}$${digest}`;
}

export function verifyPin(pin: string, storedHash: string) {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const [, salt, hash] = parts;
  const candidate = crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

export function signDeviceToken(claims: Omit<DeviceTokenClaims, "iat" | "exp">, ttlSeconds = 60 * 60 * 24 * 30) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const payload: DeviceTokenClaims = { ...claims, iat, exp };
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", checkinV2Config.deviceJwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`;
}

export function verifyDeviceToken(token: string): DeviceTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = crypto
    .createHmac("sha256", checkinV2Config.deviceJwtSecret)
    .update(`${header}.${payload}`)
    .digest();

  try {
    if (!crypto.timingSafeEqual(base64UrlDecode(signature), expected)) return null;
    const data = JSON.parse(base64UrlDecode(payload).toString("utf8")) as DeviceTokenClaims;
    const now = Math.floor(Date.now() / 1000);
    if (data.type !== "device" || data.exp < now) return null;
    return data;
  } catch {
    return null;
  }
}


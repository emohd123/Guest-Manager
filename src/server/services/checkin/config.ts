const DEFAULT_IOS_URL = "https://apps.apple.com/us/app/guest-manager-check-in/id1460267612";

function parseNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const checkinV2Config = {
  enabled: process.env.CHECKIN_APP_V2_ENABLED
    ? process.env.CHECKIN_APP_V2_ENABLED === "true"
    : true,
  deviceJwtSecret:
    process.env.MOBILE_DEVICE_JWT_SECRET ?? "dev-mobile-device-secret-change-me",
  onlineThresholdSeconds: parseNumber("MOBILE_ONLINE_THRESHOLD_SECONDS", 90),
  pairQrTtlSeconds: parseNumber("MOBILE_PAIR_QR_TTL_SECONDS", 120),
  iosUrl: process.env.NEXT_PUBLIC_MOBILE_IOS_URL ?? DEFAULT_IOS_URL,
  androidUrl: process.env.NEXT_PUBLIC_MOBILE_ANDROID_URL ?? "",
};


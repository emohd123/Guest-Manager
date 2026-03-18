const DEFAULT_APP_URL = "https://events-hub.vercel.app";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return trimTrailingSlash(trimmed);
}

export function getAppUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) || DEFAULT_APP_URL;
}

export function getAppUrlObject() {
  return new URL(getAppUrl());
}

export function getMobileIosUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_MOBILE_IOS_URL);
}

export function getMobileAndroidUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_MOBILE_ANDROID_URL);
}

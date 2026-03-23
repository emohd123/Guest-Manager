import Constants from "expo-constants";

const fallbackBaseUrl = "https://events-hub-vert.vercel.app";
const extra = ((Constants.expoConfig?.extra ?? {}) as Record<string, unknown>) ?? {};

function getWebBaseUrl() {
  if (typeof window === "undefined") return undefined;
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3000`;
}

function normalizeBaseUrl(value?: string) {
  if (!value) return fallbackBaseUrl;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getApiBaseUrl() {
  const webBaseUrl = getWebBaseUrl();
  return normalizeBaseUrl(
    process.env.EXPO_PUBLIC_API_URL ||
      webBaseUrl ||
      extra.apiBaseUrl ||
      fallbackBaseUrl
  );
}

export function getExpoProjectId() {
  const eas = (extra.eas ?? {}) as Record<string, unknown>;
  return String(eas.projectId ?? extra.easProjectId ?? "");
}

import Constants from "expo-constants";

const fallbackBaseUrl = "https://www.iticket.info";
const extra = ((Constants.expoConfig?.extra ?? {}) as Record<string, unknown>) ?? {};

function getWebBaseUrl() {
  if (typeof window === "undefined" || !window.location) return undefined;
  const { protocol, hostname } = window.location;
  if (!protocol || !hostname) return undefined;
  return `${protocol}//${hostname}:3000`;
}

function normalizeBaseUrl(value?: string) {
  if (!value) return fallbackBaseUrl;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(
    process.env.EXPO_PUBLIC_API_URL ||
      extra.apiBaseUrl ||
      getWebBaseUrl() ||
      fallbackBaseUrl
  );
}

export function getExpoProjectId() {
  const eas = (extra.eas ?? {}) as Record<string, unknown>;
  return String(eas.projectId ?? extra.easProjectId ?? "");
}

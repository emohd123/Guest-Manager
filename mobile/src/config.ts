import Constants from "expo-constants";

const fallbackBaseUrl = "http://localhost:3000";
const extra = ((Constants.expoConfig?.extra ?? {}) as Record<string, unknown>) ?? {};

function normalizeBaseUrl(value?: string) {
  if (!value) return fallbackBaseUrl;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(
    process.env.EXPO_PUBLIC_API_URL ||
      extra.apiBaseUrl ||
      fallbackBaseUrl
  );
}

export function getExpoProjectId() {
  const eas = (extra.eas ?? {}) as Record<string, unknown>;
  return String(eas.projectId ?? extra.easProjectId ?? "");
}

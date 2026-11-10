export const EXPO_TOKEN_PATTERN =
  /^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/;

export function notificationDestination(
  data: Record<string, unknown>,
  baseUrl: string,
): string | null {
  if (typeof data.url !== "string") return null;
  try {
    const base = new URL(baseUrl);
    const url = new URL(data.url, base);
    if (url.origin !== base.origin || url.username || url.password) return null;
    if (
      !/^\/(?:e\/|private-event\/(?:access|portal|speaker-portal)\/|account(?:\/|$)|search(?:\/|$))/.test(
        url.pathname,
      )
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

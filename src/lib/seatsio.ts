export const DEFAULT_SEATSIO_CHART_KEY = "68f78e07-c80b-5a1a-2f28-a696ec3d4113";

const SEATSIO_KEY_PATTERN = /^[A-Za-z0-9_-]{3,128}$/;

export function readSeatsIoChartKey(settings: unknown): string | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const root = settings as Record<string, unknown>;
  const seatsIo = root.seatsIo && typeof root.seatsIo === "object" && !Array.isArray(root.seatsIo)
    ? (root.seatsIo as Record<string, unknown>)
    : null;
  const value = seatsIo?.chartKey ?? root.seatsIoChartKey;
  return typeof value === "string" && SEATSIO_KEY_PATTERN.test(value) ? value : null;
}

export function readSeatsIoEventKey(settings: unknown): string | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const root = settings as Record<string, unknown>;
  const seatsIo = root.seatsIo && typeof root.seatsIo === "object" && !Array.isArray(root.seatsIo)
    ? (root.seatsIo as Record<string, unknown>) : null;
  const value = seatsIo?.eventKey ?? root.seatsIoEventKey;
  return typeof value === "string" && SEATSIO_KEY_PATTERN.test(value) ? value : null;
}

export function seatsIoEventKeyFor(eventId: string, chartKey: string) {
  return `iticket-${eventId}-${chartKey}`.slice(0, 128);
}

export function mergeSeatsIoConfig(settings: unknown, chartKey: string | null, eventKey: string | null) {
  const current = settings && typeof settings === "object" && !Array.isArray(settings)
    ? { ...(settings as Record<string, unknown>) } : {};
  const seatsIo = current.seatsIo && typeof current.seatsIo === "object" && !Array.isArray(current.seatsIo)
    ? { ...(current.seatsIo as Record<string, unknown>) } : {};
  if (chartKey) seatsIo.chartKey = chartKey; else delete seatsIo.chartKey;
  if (eventKey) seatsIo.eventKey = eventKey; else delete seatsIo.eventKey;
  current.seatsIo = seatsIo;
  return current;
}

export function mergeSeatsIoChartKey(settings: unknown, chartKey: string | null) {
  return mergeSeatsIoConfig(settings, chartKey, readSeatsIoEventKey(settings));
}

const SEATSIO_API_BASE = "https://api-eu.seatsio.net";

function seatsIoAuthHeaders() {
  const secret = process.env.SEATSIO_SECRET_KEY;
  if (!secret) throw new Error("SEATSIO_SECRET_KEY is not configured");
  return {
    Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

export async function bookSeatsIoObjects(eventKey: string, objects: string[], orderId: string) {
  if (!objects.length) return;
  const response = await fetch(`${SEATSIO_API_BASE}/events/${encodeURIComponent(eventKey)}/actions/book`, {
    method: "POST",
    headers: seatsIoAuthHeaders(),
    body: JSON.stringify({ objects, orderId }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Seats.io booking failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }
}

export async function releaseSeatsIoObjects(eventKey: string, objects: string[]) {
  if (!objects.length) return;
  await fetch(`${SEATSIO_API_BASE}/events/${encodeURIComponent(eventKey)}/actions/release`, {
    method: "POST",
    headers: seatsIoAuthHeaders(),
    body: JSON.stringify({ objects }),
    cache: "no-store",
  }).catch(() => undefined);
}
